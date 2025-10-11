# Gemini Workspace

This file is used by the Gemini AI to understand and manage the project.

## Next.js 15 Development Guide

This guide outlines the best practices for developing a Next.js 15 project using the App Router, `react-hook-form`, `shadcn/ui`, and `useActionState` for form state management.

### Project Setup

1.  **Create a Next.js project:**
    ```bash
    npx create-next-app@latest --typescript --tailwind --eslint
    ```

2.  **Install `shadcn/ui`:**
    ```bash
    npx shadcn-ui@latest init
    ```
    This will set up the necessary dependencies and configuration for using `shadcn/ui` components.

3.  **Install `react-hook-form` and `zod`:**
    ```bash
    pnpm install react-hook-form zod @hookform/resolvers
    ```

### UI Components with `shadcn/ui`

`shadcn/ui` provides a set of accessible and customizable components that can be easily integrated into your project.

To add a new component, run the following command:
```bash
npx shadcn-ui@latest add [component-name]
```
For example, to add a button component:
```bash
npx shadcn-ui@latest add button
```

### Form Management with `react-hook-form` and `zod`

`react-hook-form` is a powerful library for managing forms in React. When combined with `zod`, you can create robust and type-safe forms with ease.

1.  **Define a schema:**
    Create a `zod` schema to define the shape and validation rules for your form data.

    ```typescript
    import { z } from 'zod';

    export const formSchema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
    });
    ```

2.  **Create a form component:**
    Use the `useForm` hook from `react-hook-form` to manage the form state and validation.

    ```tsx
    'use client';

    import { useForm } from 'react-hook-form';
    import { zodResolver } from '@hookform/resolvers/zod';
    import { formSchema } from './schema';

    export function MyForm() {
      const form = useForm({
        resolver: zodResolver(formSchema),
      });

      // ...
    }
    ```

### State Management in forms with `useActionState`

`useActionState` is a React hook that allows you to manage the state of a form action. It is particularly useful for handling form submissions and displaying feedback to the user.

1.  **Create a server action:**
    Define a server action that will handle the form submission. This function will be called when the form is submitted.

    ```typescript
    'use server';

    export async function submitForm(previousState, formData) {
      // ...
    }
    ```

2.  **Use `useActionState` in your form component:**
    Pass the server action to the `useActionState` hook to manage the form state.

    ```tsx
    'use client';

    import { useActionState } from 'react';
    import { submitForm } from './actions';

    export function MyForm() {
      const [state, formAction] = useActionState(submitForm, null);

      // ...
    }
    ```

### Putting it all together

Here is an example of a complete form component that uses `react-hook-form`, `zod`, and `useActionState`.

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useActionState } from 'react';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function submitForm(previousState, formData) {
  const result = formSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!result.success) {
    return {
      ...previousState,
      errors: result.error.flatten().fieldErrors,
    };
  }

  // ... handle form submission

  return {
    ...previousState,
    message: 'Form submitted successfully!',
  };
}

export function MyForm() {
  const [state, formAction] = useActionState(submitForm, {
    message: '',
    errors: {},
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  return (
    <Form {...form}>
      <form action={formAction} className="space-y-8">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="shadcn" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormDescription>
                Password must be at least 8 characters.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```
