# Supabase Setup Guide for Task Planner

This guide will walk you through setting up Supabase for the Task Planner application, including creating a project, configuring authentication, and setting up the database schema.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Create a Supabase Project](#create-a-supabase-project)
3. [Get Your API Keys](#get-your-api-keys)
4. [Configure Environment Variables](#configure-environment-variables)
5. [Configure Password Requirements](#configure-password-requirements)
6. [Run Database Migrations](#run-database-migrations)
7. [Configure Authentication Settings](#configure-authentication-settings)
8. [Test Your Setup](#test-your-setup)

---

## Prerequisites

- A Supabase account (sign up at [https://supabase.com](https://supabase.com))
- Node.js and npm installed on your machine
- The Task Planner application code

---

## Create a Supabase Project

1. **Sign in to Supabase**
   - Go to [https://app.supabase.com](https://app.supabase.com)
   - Sign in with your account or create a new one

2. **Create a New Project**
   - Click the "New Project" button
   - Fill in the project details:
     - **Name**: Task Planner (or your preferred name)
     - **Database Password**: Choose a strong password (save this securely)
     '3v8J"8!8W>0
     - **Region**: Select the region closest to your users
     - **Pricing Plan**: Select Free tier or your preferred plan
   - Click "Create new project"
   - Wait for the project to be created (this may take 1-2 minutes)
Project URL: https://pbtfwjuvuxlueegdxmzs.supabase.co
Publishable API sb_publishable_yd-y9oMq-Boe1DhfXfDl_g_mKN5yXPz
---

## Get Your API Keys

1. **Navigate to Project Settings**
   - In your Supabase project dashboard, click on the "Settings" icon (gear icon) in the left sidebar
   - Click on "API" in the settings menu

2. **Copy Your Credentials**
   You'll need two values:
   - **Project URL**: Found under "Project URL" (e.g., `https://xxxxxxxxxxxxx.supabase.co`)
   - **Anon Key**: Found under "Project API keys" → "anon public" (this is safe to use in the browser)

   ⚠️ **Important**: Never commit these keys to version control. Keep the `service_role` key secret!

---

## Configure Environment Variables

1. **Create a .env file**
   - Navigate to the `login-app` directory
   - Copy the `.env.example` file to create a new `.env` file:
     ```bash
     cd login-app
     cp .env.example .env
     ```

2. **Add Your Credentials**
   - Open the `.env` file in your text editor
   - Replace the placeholder values with your actual credentials:
     ```env
     VITE_SUPABASE_URL=https://your-project-id.supabase.co
     VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
     ```

3. **Verify .gitignore**
   - Ensure `.env` is listed in your `.gitignore` file (it should already be there)
   - This prevents accidentally committing your credentials

---

## Configure Password Requirements

The application enforces the following password requirements on the client side:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

To configure these requirements in Supabase:

1. **Navigate to Authentication Settings**
   - In your Supabase project, click "Authentication" in the left sidebar
   - Click "Policies" or "Settings"

2. **Configure Password Settings**
   - Go to "Auth" → "Settings" in the Supabase dashboard
   - Scroll to "Password Settings"
   - Set **Minimum Password Length**: 8
   - Note: Supabase doesn't have built-in complexity requirements, but our client-side validation handles this

3. **Email Confirmation Settings** (Optional but Recommended)
   - In "Authentication" → "Settings"
   - Enable "Enable email confirmations" if you want users to verify their email
   - Configure your email templates under "Email Templates"

---

## Run Database Migrations

The database migration creates a `profiles` table for extended user information and sets up Row Level Security (RLS) policies.

### Option 1: Using Supabase SQL Editor (Recommended for Beginners)

1. **Open the SQL Editor**
   - In your Supabase project dashboard, click "SQL Editor" in the left sidebar
   - Click "New query"

2. **Run the Migrations**
   - Run each migration file in order:
     - `supabase/migrations/001_initial_auth_setup.sql` - Creates profiles table
     - `supabase/migrations/002_update_profiles_name_columns.sql` - Adds first_name and last_name columns
     - `supabase/migrations/003_add_avatar_fields.sql` - Adds avatar fields (avatar_type, avatar_preset)
     - `supabase/migrations/004_create_avatars_storage.sql` - Creates storage bucket for avatar uploads
   - For each file:
     - Open the migration file
     - Copy the entire contents
     - Paste it into the SQL Editor
     - Click "Run" to execute the migration

3. **Verify Success**
   - You should see a success message for each migration
   - Go to "Table Editor" in the left sidebar
   - Verify that the `profiles` table exists with columns: `id`, `email`, `first_name`, `last_name`, `avatar_type`, `avatar_preset`, `avatar_url`, `created_at`, `updated_at`
   - Go to "Storage" in the left sidebar
   - Verify that the `avatars` bucket exists and is public

### Option 2: Using Supabase CLI (For Advanced Users)

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```

3. **Link Your Project**
   ```bash
   supabase link --project-ref your-project-id
   ```

4. **Run Migrations**
   ```bash
   supabase db push
   ```

---

## Configure Authentication Settings

1. **Email Authentication**
   - Go to "Authentication" → "Providers"
   - Ensure "Email" is enabled (it should be by default)

2. **Site URL Configuration**
   - Go to "Authentication" → "URL Configuration"
   - Set **Site URL**: `http://localhost:5173` (for local development)
   - Add additional URLs for production later

3. **Redirect URLs** (Optional for OAuth)
   - Add `http://localhost:5173/**` to "Redirect URLs" for local development
   - This allows OAuth callbacks to work properly

---

## Test Your Setup

1. **Install Dependencies**
   ```bash
   cd login-app
   npm install
   ```

2. **Start the Development Server**
   ```bash
   npm run dev
   ```

3. **Test Sign Up**
   - Open your browser to `http://localhost:5173`
   - Click "Sign up"
   - Fill in the form with a test email and password
   - Submit the form
   - Check for success message or any errors

4. **Verify in Supabase**
   - Go to your Supabase project dashboard
   - Click "Authentication" → "Users"
   - You should see your newly created user
   - Check "Table Editor" → "profiles" to verify the profile was created

5. **Check Email** (if email confirmation is enabled)
   - Check your email inbox for a confirmation email
   - Click the confirmation link

---

## Troubleshooting

### "Missing Supabase environment variables" Error
- Verify your `.env` file exists in the `login-app` directory
- Ensure variable names start with `VITE_` (required for Vite)
- Restart your development server after adding environment variables

### "Invalid API Key" Error
- Double-check you copied the correct keys from Supabase
- Ensure you're using the `anon` key, not the `service_role` key
- Verify there are no extra spaces or quotes in your `.env` file

### Users Not Appearing in Database
- Check the Supabase logs: "Logs" → "Postgres Logs"
- Verify the trigger was created: Check in SQL Editor with:
  ```sql
  SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
  ```
- Ensure RLS policies are enabled on the profiles table

### Email Not Sending
- For local development, check "Authentication" → "Settings" → "SMTP Settings"
- Configure a custom SMTP server or use Supabase's default (limited emails)
- Check spam/junk folders

---

## Next Steps

1. **Production Setup**
   - Update your Site URL and Redirect URLs for production
   - Configure a custom SMTP server for reliable email delivery
   - Set up proper rate limiting

2. **Additional Security**
   - Enable CAPTCHA for sign-ups (in Authentication Settings)
   - Set up email rate limiting
   - Configure MFA (Multi-Factor Authentication) if needed

3. **Database Backups**
   - Enable automatic backups in Project Settings
   - Consider a backup strategy for production

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)

---

## Support

If you encounter issues:
1. Check the [Supabase Community Forum](https://github.com/supabase/supabase/discussions)
2. Review the [Supabase GitHub Issues](https://github.com/supabase/supabase/issues)
3. Consult the application's README or documentation

