# React / Next.js Standards

## Framework

- Next.js with App Router (not Pages Router).
- UI components: ShadCN UI. Do not install other component libraries.
- Styling: Tailwind CSS (comes with ShadCN). No CSS modules or styled-components.

## Client Components

- `"use client"` directive required on all React client components (Next.js App Router).
- React hooks must be called unconditionally — hooks before any early returns.

## JSX

- **No imperative logic inside JSX.** All conditional logic and variable declarations must be computed in the component body before the `return` statement, or extracted into a dedicated child component. Simple functional expressions are fine in JSX — inline arrow functions, ternaries, and `.map()` calls that return JSX directly are all permitted. What is prohibited is multi-statement blocks: declaring intermediate variables and then returning a value inside JSX.
- JSX should only contain simple functional expressions: `items.map(item => <Item key={item.id} {...item} />)`.

## Component Structure

- Components should have a single JSX return statement. Invalid states should be prevented by the type system or guarded against by the calling component. An early `return null` can be acceptable if the invalid state is infeasible for the parent component to detect, but the component itself should be returned as a single JSX block.
