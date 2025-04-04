"use client";

import { createPost } from "@/actions/posts";
import { useState, useTransition } from "react";

export default function CreatePostForm() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);

    startTransition(async () => {
      const res = await createPost(formData);
      if (res.status === "success") {
        setStatus("Post erfolgreich erstellt!");
        setTitle("");
        setContent("");
      } else {
        setStatus(res.message || "Ein Fehler ist aufgetreten.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titel"
        className="w-full border px-4 py-2 rounded"
        required
      />
      <textarea
        name="content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Inhalt"
        rows={6}
        className="w-full border px-4 py-2 rounded"
        required
      />
      <button
        type="submit"
        disabled={isPending}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {isPending ? "Wird erstellt..." : "Post erstellen"}
      </button>
      {status && <p className="text-sm mt-2">{status}</p>}
    </form>
  );
}
