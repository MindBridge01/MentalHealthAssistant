# Editable Figma dashboards

[Open the dashboard collection](https://www.figma.com/design/qBwHaSZX7yxZsIxNMfkGGv/Mind-bridge?node-id=95-1211)

The originally empty target frame now contains desktop and mobile overview screens for Patient, Professional, Hospital booking officer, and Administrator. The collection uses the existing file's purple/neutral variables, spacing/radius variables, Google Sans Flex text styles, and Button variants. Feature cards reuse Simple Design System Card instances. Responsive metric and navigation patterns are local components positioned next to the collection.

Validation: 985 editable descendants, including 504 text layers, 112 component instances and 963 nodes with variable bindings. Four image-filled nodes are the exact discrete Mind Bridge logo; there are no complete-screen raster images in the deliverable. No font mismatches or horizontal layout overflow remain. The temporary source capture was removed.

The Simple Design System Stats Card was tested and applied initially. Its immutable 240px minimum width prevented the 165px mobile metric layout, so it was replaced with local token-bound metric content and exposed Label, Value, and Hint properties. The surrounding reusable Dashboard / Metric component remains linked across all screens.

The main application's index.html was restored after capture. The temporary capture script has also been removed from the isolated dashboard preview fixture. Sample content is fictional review data. No accounts, credentials, approval states, or database records were changed.
