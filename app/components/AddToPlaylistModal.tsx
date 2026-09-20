"use client";

import React, { useEffect, useState } from "react";
import { X, ListMusic, Check, Plus, Loader2 } from "lucide-react";

interface Playlist {
  id: number;
  name: string;
  _count?: { songs: number };
}

type Status = "idle" | "loading" | "added" | "error";

interface AddToPlaylistModalProps {
  songId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AddToPlaylistModal({
  songId,
  isOpen,
  onClose,
}: AddToPlaylistModalProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [statusMap, setStatusMap] = useState<Record<number, Status>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !songId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setStatusMap({});

        // 1️⃣ fetch playlists
        const plRes = await fetch("/api/playlists");
        const plData: Playlist[] = await plRes.json();
        setPlaylists(plData);

        // 2️⃣ pre-check playlist
        const checkRes = await fetch(
          `/api/playlists/check?songId=${songId}`
        );
        const checkData = await checkRes.json();
        const addedIds: number[] = checkData.playlistIds ?? [];

        // 3️⃣ set status
        const initial: Record<number, Status> = {};
        plData.forEach((pl) => {
          initial[pl.id] = addedIds.includes(pl.id)
            ? "added"
            : "idle";
        });

        setStatusMap(initial);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, songId]); // ⚠️ JANGAN DIUBAH

  const handleAdd = async (playlistId: number) => {
    if (!songId || statusMap[playlistId] === "added") return;

    setStatusMap((p) => ({ ...p, [playlistId]: "loading" }));

    try {
      await fetch(`/api/playlists/${playlistId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", songId }),
      });

      setStatusMap((p) => ({ ...p, [playlistId]: "added" }));
      window.dispatchEvent(new Event("refreshSidebar"));
    } catch {
      setStatusMap((p) => ({ ...p, [playlistId]: "error" }));
      setTimeout(() => {
        setStatusMap((p) => ({ ...p, [playlistId]: "idle" }));
      }, 1500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#181818] rounded-2xl border border-zinc-800 w-full max-w-md max-h-[80vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h3 className="text-white font-bold flex items-center gap-3">
            <div className="bg-zinc-800 p-2 rounded-full">
              <ListMusic size={18} />
            </div>
            Tambahkan ke...
          </h3>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="py-10 flex flex-col items-center gap-2 text-zinc-500">
              <Loader2 className="animate-spin" />
              <span className="text-xs">Memuat playlist...</span>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {playlists.map((pl) => {
                const status = statusMap[pl.id] ?? "idle";
                return (
                  <button
                    key={pl.id}
                    onClick={() => handleAdd(pl.id)}
                    disabled={status !== "idle"}
                    className={`
                      flex justify-between items-center px-4 py-3 rounded-lg text-left
                      ${
                        status === "added"
                          ? "bg-green-500/10 text-green-500 border border-green-500/20 cursor-default"
                          : status === "error"
                          ? "bg-red-500/10 text-red-500 border border-red-500/20"
                          : "text-zinc-300 hover:bg-zinc-800"
                      }
                    `}
                  >
                    <div className="truncate">
                      <div className="font-semibold text-sm truncate">
                        {pl.name}
                      </div>
                      {pl._count && (
                        <div className="text-[10px] opacity-60">
                          {pl._count.songs} lagu
                        </div>
                      )}
                    </div>

                    {status === "loading" && (
                      <Loader2 size={16} className="animate-spin" />
                    )}
                    {status === "added" && <Check size={16} />}
                    {status === "idle" && <Plus size={16} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="bg-white text-black px-6 py-2 rounded-full text-sm font-bold"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
