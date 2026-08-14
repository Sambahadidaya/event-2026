fokus ke saat menguplouad bukti pembayaran yang di api src/api/supabase/storage.js,
kenapa waktu mengirim file atau gambar atau pdf itu kesimpan didatabase distoragenya malah crash (tidak muncul) padahal sudah ada link storagenya dan error atau bug ini berlaku ketika sudah dideploy ke vercel, jadi ketika mendaftar dan mengirim foto dengan website produc itu ke foto kesimpan ke storagenya malah crash padahal saat dilocal atau di development seperti saat npm run dev itu biasa aja tidak ada crash dan seperti aku mengirim atau mengisi form di mode dev terus ketika dicek di mode produc (yg sudah sudah upload di vercel) itu muncul dan biasa saja. coba baca file stroragenya dan baca juga library atau dependsi yang ada, berikut depedensi yang ada ;
```json
      "dependencies": {
        "@sparticuz/chromium-min": "^149.0.0",
        "@supabase/ssr": "^0.12.3",
        "@supabase/supabase-js": "^2.108.2",
        "canvas": "^3.2.3",
        "chart.js": "^4.5.1",
        "file-type": "^22.0.1",
        "fuse.js": "^7.4.2",
        "html5-qrcode": "^2.3.8",
        "jsqr": "^1.4.0",
        "lucide-react": "^1.21.0",
        "nanoid": "^5.1.16",
        "next": "^16.2.11",
        "next-themes": "^0.4.6",
        "openai": "^6.45.0",
        "pdf-lib": "^1.17.1",
        "puppeteer-core": "^25.4.0",
        "qrcode": "^1.5.4",
        "react": "19.2.4",
        "react-chartjs-2": "^5.3.1",
        "react-dom": "19.2.4",
        "react-image-crop": "^11.1.2",
        "react-markdown": "^10.1.0",
        "react-pdf": "^10.4.1",
        "remark-gfm": "^4.0.1",
        "sharp": "^0.35.3",
        "tree-node-cli": "^3.0.0",
        "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "babel-plugin-react-compiler": "1.0.0",
    "puppeteer": "^25.4.0",
    "tailwindcss": "^4"
  }
```