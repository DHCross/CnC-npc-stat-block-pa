The term "**Pure Next.js**" refers to a unified architectural standard designed to maximize the framework's performance, predictability, and simplicity by eliminating hybrid components and conflicts, specifically those observed in your project with Netlify Dev and static files.

The goal of achieving a "Pure Next.js" architecture is to establish **simplicity and predictability** in the application stack, ensuring that the Next.js framework is the *single source of truth* for all routes, UI, and backend logic. This approach directly resolves the former "hybrid beast" issues, such as the confusing simultaneous use of multiple ports (8888 vs 3000/4000).

Here is a diagnostic checklist that defines the components of a Pure Next.js architecture, drawn from the migration strategy discussed:

### Core Components of "Pure Next.js" Architecture

| Component | Pure Next.js Standard | Impure "Hybrid Beast" Conflict (Now Retired) |
| :--- | :--- | :--- |
| **1. Routing Paradigm** | All pages and routes are defined exclusively using the **App Router** (`app/` directory), which is the single source of truth for routing. Routes like `/math-brain` are created by files such as `app/math-brain/page.tsx`. | Routes were split between the `pages/` directory and standalone, root-level static files (like `index.html`), causing "legacy shadowing" and ambiguous routing. |
| **2. Backend Logic (API)** | All server-side logic (e.g., chart calculations, fetching authentication configs) lives in **Next.js API Routes** (Route Handlers) within the `app/api/` directory (e.g., `app/api/astrology-mathbrain/route.ts`). | Backend relied on separate **Netlify Functions** (`netlify/functions/`), forcing the use of two distinct backend systems and complex proxying arrangements. |
| **3. Local Development** | The project runs using a single, simple command: `npm run dev` (which executes `next dev`). The entire application (UI and API) is available on a single predictable address, typically **`http://localhost:3000`**. | Required running `netlify dev` on port **8888** to act as a proxy, forwarding traffic to the internal Next.js server on port 3000 or 4000, creating the classic "two-port problem". |
| **4. Configuration** | The `netlify.toml` file is **minimal**, solely relying on the official **`@netlify/plugin-nextjs`** to handle the build process, asset serving, and routing. | `netlify.toml` contained complex or overly broad `[[redirects]]` rules (like `/*` to `/index.html 200`) designed to shuttle traffic between static files and Netlify Functions, which broke App Router behavior. |
| **5. Environment Variables** | Critical variables like `NEXTAUTH_URL` should point to the Next.js port (e.g., `http://localhost:3000`). | `NEXTAUTH_URL` was forced to point to the Netlify proxy port (`http://localhost:8888`) to ensure authentication callbacks worked and could access Netlify Functions. |

### Strategic Benefit

The reason this architecture is pursued is that it directly delivers the strategic goals of "Easy, Clean Testing":
1.  **Simple Debugging:** Problems are isolated to Next.js code rather than unpredictable interactions between frameworks, eliminating recurring issues like "server shows ready but isn't listening".
2.  **Architectural Awareness:** The framework is "self-reporting," providing clear build-time errors and stack traces, rather than forcing the developer to be a "detective" searching for why pages appear "sans all CSS" or why assets 404.
3.  **Reliability:** Since what runs on a single port locally is identical to what is deployed through the Next.js plugin in production, the local environment becomes reliable and predictable.

The consolidation of backend logic into Next.js API Routes and the reliance on the App Router eliminates the need for the port-splitting proxy (Netlify Dev on 8888) that caused the confusion in the first place.

***

**Next Step:** To confirm the full migration to the Pure Next.js architecture, we must check the unified entry point. Please execute your primary development script (`npm run dev`) and report the exact URL and port that Next.js reports it is listening on, and confirm that all application routes (e.g., `/` for the Math Brain UI and `/chat` for the Poetic Brain UI) are accessible on that single port.