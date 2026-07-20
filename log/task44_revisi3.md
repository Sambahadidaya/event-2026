ada bug ini ;
```log
Error: Could not find a production build in the '.next' directory. Try building your app with 'next build' before starting the production server. https://nextjs.org/docs/messages/production-start-no-build-id
    at ignore-listed frames
PS C:\Users\samba\OneDrive\Documents\PKKMB-POSE\portal-kampus-2026> npm run build

> portal-kampus-2026@0.1.0 build
> next build

▲ Next.js 16.2.9 (Turbopack)
- Environments: .env.local

  Creating an optimized production build ...

> Build error occurred
Error: Turbopack build failed with 2 errors:
./src/components/SamsMateriBot.js:6:1
Export saveChatHistory doesn't exist in target module
  4 | import { Bot, Headset, X, Send } from 'lucide-react';
  5 | import { generateMateriAnswer } from '@/api/openai/materi';
> 6 | import { saveChatHistory } from '@/api/openai/chat';
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  7 |
  8 | // Menyisipkan custom keyframes untuk animasi melayang acak dan titik berpikir
  9 | const customStyles = `

The export saveChatHistory was not found in module [project]/src/api/openai/chat.js [app-client] (ecmascript).
Did you mean to import generateAnswer?
All exports of the module are statically known (It doesn't have dynamic exports). So it's known statically that the requested export doesn't exist.

Import traces:
  Client Component Browser:
    ./src/components/SamsMateriBot.js [Client Component Browser]
    ./src/app/pkkmb/materi/[id]/page.js [Client Component Browser]
    ./src/app/pkkmb/materi/[id]/page.js [Server Component]

  Client Component SSR:
    ./src/components/SamsMateriBot.js [Client Component SSR]
    ./src/app/pkkmb/materi/[id]/page.js [Client Component SSR]
    ./src/app/pkkmb/materi/[id]/page.js [Server Component]


./src/components/SamsMateriBot.js:6:1
Export saveChatHistory doesn't exist in target module
  4 | import { Bot, Headset, X, Send } from 'lucide-react';
  5 | import { generateMateriAnswer } from '@/api/openai/materi';
> 6 | import { saveChatHistory } from '@/api/openai/chat';
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  7 |
  8 | // Menyisipkan custom keyframes untuk animasi melayang acak dan titik berpikir
  9 | const customStyles = `

The export saveChatHistory was not found in module [project]/src/api/openai/chat.js [app-ssr] (ecmascript).
Did you mean to import generateAnswer?
All exports of the module are statically known (It doesn't have dynamic exports). So it's known statically that the requested export doesn't exist.

Import traces:
  Client Component Browser:
    ./src/components/SamsMateriBot.js [Client Component Browser]
    ./src/app/pkkmb/materi/[id]/page.js [Client Component Browser]
    ./src/app/pkkmb/materi/[id]/page.js [Server Component]

  Client Component SSR:
    ./src/components/SamsMateriBot.js [Client Component SSR]
    ./src/app/pkkmb/materi/[id]/page.js [Client Component SSR]
    ./src/app/pkkmb/materi/[id]/page.js [Server Component]


    at <unknown> (./src/components/SamsMateriBot.js:6:1)
    at <unknown> (./src/components/SamsMateriBot.js:6:1)
```