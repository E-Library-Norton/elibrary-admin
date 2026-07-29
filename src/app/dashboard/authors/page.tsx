import { redirect } from "next/navigation";

export default function AuthorsRedirectPage() {
  redirect("/dashboard/books/authors");
}
