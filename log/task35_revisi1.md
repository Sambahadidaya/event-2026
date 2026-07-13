ada bug ini ;
```log

⨯ Error: Event handlers cannot be passed to Client Component props.
  <... href="/" onClick={function onClick} className=... children=...>
                        ^^^^^^^^^^^^^^^^^^
If you need interactivity, consider converting part of this to a Client Component.
    at stringify (<anonymous>)
    at stringify (<anonymous>) {
  digest: '2946888175'
}
 GET /pkkmb 500 in 3.9s (next.js: 2.5s, application-code: 1343ms)
[browser] Encountered a script tag while rendering React component. Scripts inside React components are never executed when rendering on the client. Consider using template tag instead (https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template).
[browser] Uncaught Error: Event handlers cannot be passed to Client Component props.
  <... href="/" onClick={function onClick} className=... children=...>
                        ^^^^^^^^^^^^^^^^^^
If you need interactivity, consider converting part of this to a Client Component.
    at stringify (<anonymous>:1:18)
    at stringify (<anonymous>:1:18)
    at PkkmbLayout (src\app\pkkmb\layout.js:43:13)
  41 |             </main>
  42 |
> 43 |             <PublicFooter site="pkkmb" links={pkkmbLinks} />
     |             ^
  44 |
  45 |             <SamsChatbot />
  46 |
```