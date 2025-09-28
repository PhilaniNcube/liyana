set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  insert into public.profiles (id, full_name, email, phone_number)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email, new.raw_user_meta_data->>'phone_number');
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user_signup(user_id uuid, user_full_name text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    user_email text;
BEGIN
    -- Get the email from auth.users table
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = user_id;
    
    -- Insert into profiles with the email
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (user_id, user_full_name, user_email, 'customer');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user_signup(user_id uuid, user_full_name text, phone_number text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    user_email text;
BEGIN
    -- Get the email from auth.users table
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = user_id;
    
    -- Insert into profiles with the email and phone number
    INSERT INTO public.profiles (id, full_name, email, phone_number, role)
    VALUES (user_id, user_full_name, user_email, phone_number, 'customer');
END;
$function$
;


