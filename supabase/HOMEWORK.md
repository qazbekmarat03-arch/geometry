# Private PDF homework

Apply `migrations/20260929000400_homework.sql` after the three earlier migrations. It adds `homework_file_name` and `homework_uploaded_at`, creates a private `homework` bucket (10 MiB, PDF MIME type), and adds admin-only write and enrollment-aware read policies. No hosted migration has been run by this code change.

If existing `homework_pdf_url` values are public HTTPS links, upload those PDFs privately and replace the links before applying the new constraint. Existing `storage://course-media/...pdf` references continue to work; new uploads go to `homework`. The migration does not delete existing files.

## Admin workflow

Open `/admin` → **Үй тапсырмаларын басқару**, or `/admin/homework`. Select the lesson and upload a PDF of up to 10 MiB. The Server Action verifies the administrator from the database before processing the file, validates extension, MIME, size and `%PDF-` header, then uploads using the administrator's cookie-scoped Supabase client. Storage RLS independently enforces the admin role. No service-role key is used.

Objects use `<course UUID>/<lesson UUID>/<random UUID>.pdf`; the original sanitized filename and upload time are stored on the lesson. The lesson's parent course comes from the database, not the form. Replacement uses a new object path and updates the lesson link only after a successful upload. If linking fails, the newly uploaded object is removed when possible. Prior/replaced objects are retained for manual administrator cleanup and become inaccessible to students once no lesson references them. This avoids deleting files still needed by concurrent sessions or another lesson.

The app accepts uploads through a Server Action with a 12 MB request cap and a 10 MiB file cap. A hosting provider may impose a smaller request limit; adjust the hosting configuration or use an authenticated direct-upload flow if needed. File signature checks are format validation, not malware scanning.

## Student workflow

Each lesson has a **Үй тапсырмасы** card showing its filename, upload date when known, and **PDF ашу** / **PDF жүктеу** buttons. The buttons remain disabled when no private PDF is attached.

Each click calls `/api/lessons/[lessonId]/homework`. The API verifies the authenticated user, confirmed email, active profile, published lesson/course, and active unexpired grant for the database-derived course. Only then does it issue a signed Storage URL using the server-only SUPABASE_SERVICE_ROLE_KEY. Apply migration 010: it removes direct student Storage reads/signing so students cannot choose a longer expiry through the Storage API. `?download=1` uses Supabase's download option to set the attachment filename; the open variant lets the browser display the PDF. No course ID, object path, or filename is accepted from the browser for authorization or signing.

Responses use private/no-store headers. URLs last at most five minutes, capped at enrollment expiry. The bucket is private, so knowing an object path alone does not grant access. Students cannot upload, overwrite, delete, or relink files. Signed URLs are temporary bearer permissions and can be reused until expiry; already downloaded files cannot be revoked.

## Verification

`npm run test:db` covers private bucket policies, course grants, expired/inactive users, unlinked/guessed paths, student writes, and rejection of public PDF links. `npm run test:homework` covers reference parsing, filename sanitization and PDF header validation. `npm run test:video` exercises the shared lesson authorization boundary. Hosted upload/download still needs a configured Supabase project and actual PDF files for an end-to-end test.

See [Supabase signed URL download support](https://supabase.com/docs/reference/javascript/file-buckets-createsignedurl).
