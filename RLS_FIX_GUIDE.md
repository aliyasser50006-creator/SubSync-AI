# SubSync AI - RLS Security Fix Guide

## Problem

You were getting a "new row violates row-level security policy" error when trying to insert jobs from the frontend, even though the user was authenticated.

## Root Cause

The issue was **client-side insert attempts with RLS policies**. When using Supabase's client SDK directly from the frontend with `insertAuth()`, the anon key has limitations:

1. The RLS policy checks `WITH CHECK (auth.uid() = user_id)`
2. When a client sends `user_id` manually, there's a mismatch between what the policy validates and what you're sending
3. The anon key can't bypass this validation

## Solution: Server Actions

We implemented **Server Actions** to handle job creation securely:

### Architecture Flow

```
Client (Browser)
    ↓
Server Action (lib/actions/jobs.ts)
    ↓
Supabase Server Client (with proper auth context)
    ↓
Database (RLS enforced)
```

### Key Changes

#### 1. Created Server Actions (`lib/actions/jobs.ts`)

Server actions run on your Next.js server with full access to the Supabase server client:

```typescript
"use server";

export async function createJob(
  videoUrl: string,
  subtitleFile: string,
  subtitleSettings: any,
) {
  // This runs on the server with proper context
  const supabase = await createClient();

  // Get authenticated user from server context
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // user_id is automatically set by the server - no client manipulation
  const { data } = await supabase
    .from("jobs")
    .insert({
      user_id: user.id, // ✅ Server-provided, not client-provided
      video_url: videoUrl,
      subtitle_file: subtitleFile,
      subtitle_settings: subtitleSettings,
      status: "pending",
    })
    .select()
    .single();
}
```

#### 2. Updated Dashboard Page

Dashboard now calls server actions instead of direct Supabase inserts:

```typescript
// Before (❌ Client-side, causes RLS error)
const { data: job, error: jobError } = await supabase
  .from('jobs')
  .insert({
    user_id: authUser.id,  // ❌ Client sending user_id
    video_url: videoUrl,
    ...
  });

// After (✅ Server action, secure and RLS-compliant)
const result = await createJob(videoUrl, fileName, settings);
```

#### 3. Enabled Server Actions in Next.js

Added to `next.config.js`:

```javascript
experimental: {
  serverActions: true,
}
```

## Why This Works

1. **Server validates user**: The server action gets the authenticated user from the request context
2. **Server provides user_id**: The `user_id` is set by the server, not the client
3. **RLS sees matching values**: When the INSERT happens, `auth.uid()` matches the provided `user_id`
4. **Policy passes**: `WITH CHECK (auth.uid() = user_id)` evaluates to true

## RLS Policies (Unchanged)

Your database policies remain the same and are correct:

```sql
CREATE POLICY "Users can insert own jobs"
  ON jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

This policy is **more secure** because:

- It prevents users from inserting jobs for other users
- The server validates the user before inserting
- No trust of client-provided user IDs

## Best Practices Applied

### ✅ Do This

1. **Use Server Actions for database writes**

   ```typescript
   'use server';
   export async function createJob(...) {
     const supabase = await createClient();
     const { data: { user } } = await supabase.auth.getUser();
     // User ID comes from server context
   }
   ```

2. **Use RLS to enforce ownership**

   ```sql
   CREATE POLICY "Users can only access own data"
   ON jobs FOR SELECT
   TO authenticated
   USING (auth.uid() = user_id);
   ```

3. **Validate on server, not client**
   - Never trust `user_id` from client input
   - Always get it from `auth.getUser()`

### ❌ Don't Do This

1. **Never send user_id from client**

   ```typescript
   // ❌ BAD
   const user = JSON.parse(localStorage.getItem('user'));
   await supabase.from('jobs').insert({ user_id: user.id, ... });
   ```

2. **Never disable RLS for convenience**

   ```sql
   -- ❌ WRONG
   ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;
   ```

3. **Never use overly permissive policies**
   ```sql
   -- ❌ BAD
   CREATE POLICY "Allow all" ON jobs FOR ALL USING (true);
   ```

## Testing the Fix

1. **Sign up a new user**: Create account at `/register`
2. **Submit a job**: Upload video + subtitles from dashboard
3. **Check Supabase**: Verify job appears in database with correct user_id
4. **View in My Videos**: Confirm job appears only for logged-in user

## File Changes Summary

| File                           | Change                                          |
| ------------------------------ | ----------------------------------------------- |
| `lib/actions/jobs.ts`          | New server actions for job operations           |
| `app/(app)/dashboard/page.tsx` | Use server actions instead of direct DB inserts |
| `app/(app)/my-videos/page.tsx` | Improved UI for video management                |
| `next.config.js`               | Enable server actions feature                   |

## Security Checklist

- [x] User ID always comes from `auth.getUser()` on server
- [x] RLS policies enforce ownership checks
- [x] Client cannot manipulate user IDs
- [x] All database writes use server actions
- [x] Storage bucket policies restrict access to owner
- [x] API routes use service role key for background processing

## Additional Resources

- [Supabase Server Actions](https://supabase.com/docs/guides/auth/auth-helpers/nextjs-server-side)
- [Row Level Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/forms-and-mutations)
