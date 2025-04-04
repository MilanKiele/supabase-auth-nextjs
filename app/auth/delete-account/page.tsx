"use client";

import { deleteUserAccount } from "@/actions/auth";
import { useState, useTransition } from "react";

export default function DeleteAccountForm() {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteUserAccount();

      if (res.status === "success") {
        window.location.href = "/";
      } else {
        setStatus(res.message || "Something went wrong.");
      }
    });
  };

  return (
    <div className="max-w-xl mx-auto mt-12 px-4">
      <h1 className="text-2xl font-semibold mb-4">Delete Your Account</h1>
      <p className="mb-6 text-gray-600">
        This action is irreversible. All your data will be permanently deleted.
        To confirm, please type <strong>SURE-DELETE-ACCOUNT</strong> below.
      </p>
      <div className="space-y-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type SURE-DELETE-ACCOUNT"
          className="w-full border px-4 py-2 rounded"
        />

        <button
          onClick={handleDelete}
          disabled={input !== "SURE-DELETE-ACCOUNT" || isPending}
          className={`px-4 py-2 rounded text-white ${
            input === "SURE-DELETE-ACCOUNT" && !isPending
              ? "bg-red-600 hover:bg-red-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {isPending ? "Deleting..." : "Delete Account"}
        </button>

        {status && <p className="text-sm text-red-600">{status}</p>}
      </div>
    </div>
  );
}
