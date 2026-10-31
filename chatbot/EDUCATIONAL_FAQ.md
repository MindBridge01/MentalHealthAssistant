# Built-in educational FAQ

This fallback contains 1,000 distinct question phrasings mapped to 20 short educational answers. It is not 1,000 different clinical answers, a clinician-reviewed dataset, or a repair to PDF retrieval.

The normal pipeline still screens risk and rewrites the question. Only when retrieval returns no usable context may an exact original-question match return a fixed answer. A successful LOW-risk NORMAL_INFORMATION classification is required. Provider failures, output validation failures, personal diagnosis questions and unmatched messages retain the existing fallback. Recent urgent context retains priority. Answers identify their static origin and link directly to WHO or NIMH sources; they do not invent PDF chunk IDs. Audit route: `educational_faq`.

Sources checked October 31, 2026:
- https://www.who.int/thailand/activities/doing-what-matters-in-times-of-stress
- https://www.nimh.nih.gov/health/topics/caring-for-your-mental-health
- https://www.nimh.nih.gov/health/topics/depression
- https://www.nimh.nih.gov/health/topics/anxiety-disorders

Run `npm --prefix chatbot test`. Deploy the rebuilt app image to activate this on EC2; no migration, model download or environment change is needed. Test “What is depression?” and “What grounding exercise does the WHO stress-management guide describe?” when no retrieved passages are selected. Verify the visible FAQ label and the `educational_faq` safety-event route. Continue investigating retrieval separately. Clinical review remains necessary before treating this as suitable for patient-facing production use.
