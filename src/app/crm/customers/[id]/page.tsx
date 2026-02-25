"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import PermissionGuard from "@/components/PermissionGuard";
import { usePermission } from "@/hooks/usePermission";

type ServiceOrder = {
  id: string;
  orderNumber: string;
  serviceType: string;
  status: string;
  scheduledDate: string;
  totalCost?: number | null;
};

type Vehicle = {
  id: string;
  plateNumber?: string | null;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
};

type CustomerDetail = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  preferredService?: string | null;
  customerType?: string | null;
  notes?: string | null;
  vehicles: Vehicle[];
  serviceOrders: ServiceOrder[];
  behaviorTracking?: {
    serviceFrequency: {
      totalServices: number;
      completedServices: number;
      consistency: "ROUTINE" | "IRREGULAR" | "NEW";
      averageIntervalDays: number | null;
      lastServiceAt: string | null;
      history: ServiceOrder[];
    };
    productPreference: {
      preference: "ORIGINAL" | "AFTERMARKET" | "MIXED" | "UNKNOWN";
      distribution: {
        original: number;
        aftermarket: number;
        mixed: number;
        unknown: number;
      };
      topParts: Array<{ name: string; count: number }>;
    };
    technicalInsights: Array<{
      noteId: string;
      orderNumber: string;
      content: string;
      partType: string;
      partsUsed: string[];
      createdAt: string;
      mechanic: string;
    }>;
  };
  postServiceCare?: {
    latestCompletedService: {
      serviceOrderId: string;
      orderNumber: string;
      serviceType: string;
      completedDate: string;
    } | null;
    nextServiceCountdown: {
      nextServiceDate: string | null;
      estimatedKilometer: number;
      daysRemaining: number | null;
      status: "NO_DATA" | "OVERDUE" | "DUE_SOON" | "ON_TRACK";
    };
    personalizedGuide: string[];
    diyKnowledgeBase: Array<{
      id: string;
      title: string;
      type: "ARTICLE" | "VIDEO";
      tags: string[];
      url: string;
    }>;
    feedbackLoop: Array<{
      id: string;
      serviceOrderId: string | null;
      orderNumber: string | null;
      question: string;
      answer: string | null;
      status: "OPEN" | "ANSWERED" | "CLOSED";
      askedAt: string;
      answeredAt: string | null;
      answeredBy: string | null;
    }>;
  };
};

type LiveUpdate = {
  id: string;
  serviceOrderId: string;
  orderNumber: string;
  customerName: string;
  updateType: "BEFORE" | "PROGRESS" | "AFTER";
  mediaType: "IMAGE" | "VIDEO" | null;
  mediaUrl: string | null;
  caption: string | null;
  directNote: string | null;
  createdAt: string;
  mechanicName: string | null;
  mechanicEmail: string;
};

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const customerId = params?.id || "";
  const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : "Terjadi kesalahan");
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [liveUpdates, setLiveUpdates] = useState<LiveUpdate[]>([]);
  const [feedbackQuestion, setFeedbackQuestion] = useState("");
  const [feedbackServiceOrderId, setFeedbackServiceOrderId] = useState("");
  const [answerDraft, setAnswerDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const { hasAnyPermission } = usePermission();

  useEffect(() => {
    const token = localStorage.getItem("token") || "";

    const loadLiveUpdates = async () => {
      try {
        const res = await fetch(`/api/service-live-updates?customerId=${customerId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setLiveUpdates(data.updates || []);
        }
      } catch (error) {
        console.error(error);
      }
    };

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/crm/customers/${customerId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Gagal memuat detail pelanggan");
        setCustomer(data.customer);
        await loadLiveUpdates();
      } catch (error: unknown) {
        setError(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    if (!customerId) return;
    load();

    const intervalId = window.setInterval(() => {
      loadLiveUpdates();
    }, 20000);

    return () => window.clearInterval(intervalId);
  }, [customerId]);

  const loadCustomer = async () => {
    const token = localStorage.getItem("token") || "";
    const res = await fetch(`/api/crm/customers/${customerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Gagal memuat detail pelanggan");
    setCustomer(data.customer);
  };

  async function submitFeedbackQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!customer) return;
    if (!feedbackQuestion.trim()) {
      setFeedbackMessage("Pertanyaan wajib diisi.");
      return;
    }
    setSubmitting(true);
    setFeedbackMessage("");
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/post-service-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerId: customer.id,
          serviceOrderId: feedbackServiceOrderId || null,
          question: feedbackQuestion,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal mengirim pertanyaan");
      setFeedbackQuestion("");
      setFeedbackServiceOrderId("");
      setFeedbackMessage("Pertanyaan berhasil dikirim.");
      await loadCustomer();
    } catch (err: unknown) {
      setFeedbackMessage(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitFeedbackAnswer(feedbackId: string) {
    const answer = answerDraft[feedbackId]?.trim();
    if (!answer) return;
    setSubmitting(true);
    setFeedbackMessage("");
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/post-service-feedback/${feedbackId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal menjawab feedback");
      setAnswerDraft((prev) => ({ ...prev, [feedbackId]: "" }));
      setFeedbackMessage("Jawaban berhasil disimpan.");
      await loadCustomer();
    } catch (err: unknown) {
      setFeedbackMessage(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PermissionGuard requiredPermission="crm_view">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link className="text-sm text-blue-600 hover:underline" href="/crm/customers">
              ← Kembali ke daftar pelanggan
            </Link>
            <h1 className="text-2xl font-semibold mt-2">Profil Pelanggan</h1>
          </div>
        </div>

        {loading && <div className="text-sm text-gray-500">Memuat detail...</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}

        {!loading && customer && (
          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            <div className="bg-white border rounded p-4 space-y-3">
              <div className="text-lg font-semibold">{customer.name}</div>
              <div className="text-sm text-gray-600">{customer.preferredService || "-"}</div>
              <div className="text-sm">
                <div>Email: {customer.email || "-"}</div>
                <div>HP: {customer.phone || "-"}</div>
                <div>Alamat: {customer.address || "-"}</div>
                <div>Tipe: {customer.customerType || "-"}</div>
              </div>
              {customer.notes && (
                <div className="text-sm text-gray-600">Catatan: {customer.notes}</div>
              )}

              <div>
                <div className="text-sm font-medium mb-2">Kendaraan</div>
                {customer.vehicles.length ? (
                  <div className="space-y-2">
                    {customer.vehicles.map((v) => (
                      <div key={v.id} className="border rounded p-2 text-sm">
                        <div>{`${v.brand || "-"} ${v.model || ""}`.trim()}</div>
                        <div className="text-xs text-gray-500">
                          {v.plateNumber || "-"} • {v.year || "-"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Belum ada kendaraan.</div>
                )}
              </div>
            </div>

            <div className="bg-white border rounded p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="font-semibold">Riwayat Servis Terakhir</h2>
                  <p className="text-xs text-gray-500">10 servis terakhir untuk pelanggan ini.</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-2 border text-left">Order</th>
                      <th className="p-2 border text-left">Layanan</th>
                      <th className="p-2 border text-left">Status</th>
                      <th className="p-2 border text-right">Biaya</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.serviceOrders.length ? (
                      customer.serviceOrders.map((order) => (
                        <tr key={order.id}>
                          <td className="p-2 border">{order.orderNumber}</td>
                          <td className="p-2 border">{order.serviceType}</td>
                          <td className="p-2 border">{order.status}</td>
                          <td className="p-2 border text-right">
                            {order.totalCost ? order.totalCost.toLocaleString("id-ID") : "-"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="p-3 border text-center text-gray-500" colSpan={4}>
                          Belum ada riwayat servis.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {customer.behaviorTracking && (
                <div className="mt-6 space-y-4">
                  <div>
                    <h2 className="font-semibold">Behavior Tracking</h2>
                    <p className="text-xs text-gray-500">
                      Insight kebiasaan customer dari histori servis dan catatan teknis mekanik.
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="border rounded p-3">
                      <div className="text-xs text-gray-500 mb-1">Service Frequency & History</div>
                      <div className="text-sm">Total servis: {customer.behaviorTracking.serviceFrequency.totalServices}</div>
                      <div className="text-sm">Servis selesai: {customer.behaviorTracking.serviceFrequency.completedServices}</div>
                      <div className="text-sm">
                        Konsistensi: {customer.behaviorTracking.serviceFrequency.consistency}
                      </div>
                      <div className="text-sm">
                        Rata-rata interval:{" "}
                        {customer.behaviorTracking.serviceFrequency.averageIntervalDays
                          ? `${customer.behaviorTracking.serviceFrequency.averageIntervalDays} hari`
                          : "-"}
                      </div>
                    </div>

                    <div className="border rounded p-3">
                      <div className="text-xs text-gray-500 mb-1">Product Preference</div>
                      <div className="text-sm">
                        Preferensi utama: {customer.behaviorTracking.productPreference.preference}
                      </div>
                      <div className="text-xs text-gray-600 mt-2">
                        Original: {customer.behaviorTracking.productPreference.distribution.original} | Aftermarket:{" "}
                        {customer.behaviorTracking.productPreference.distribution.aftermarket} | Mixed:{" "}
                        {customer.behaviorTracking.productPreference.distribution.mixed}
                      </div>
                      <div className="text-xs text-gray-600 mt-2">
                        Top part:{" "}
                        {customer.behaviorTracking.productPreference.topParts.length
                          ? customer.behaviorTracking.productPreference.topParts
                              .map((p) => `${p.name} (${p.count})`)
                              .join(", ")
                          : "-"}
                      </div>
                    </div>
                  </div>

                  <div className="border rounded p-3">
                    <div className="text-sm font-medium mb-2">Technical Insights (Mekanik)</div>
                    {customer.behaviorTracking.technicalInsights.length ? (
                      <div className="space-y-2">
                        {customer.behaviorTracking.technicalInsights.map((note) => (
                          <div key={note.noteId} className="text-xs border-b pb-2 last:border-b-0">
                            <div className="text-gray-500">
                              {note.orderNumber} • {new Date(note.createdAt).toLocaleDateString("id-ID")} •{" "}
                              {note.mechanic}
                            </div>
                            <div className="text-gray-700">{note.content}</div>
                            <div className="text-gray-500">
                              {note.partType} | {note.partsUsed?.length ? note.partsUsed.join(", ") : "-"}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">Belum ada technical insight dari mekanik.</div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-6 border rounded p-3">
                <div className="mb-2">
                  <h2 className="font-semibold">Transparansi & Edukasi Servis</h2>
                  <p className="text-xs text-gray-500">
                    Live status before/progress/after dan direct note dari mekanik. Auto-refresh tiap 20 detik.
                  </p>
                </div>
                {liveUpdates.length ? (
                  <div className="space-y-3">
                    {liveUpdates.map((update) => (
                      <div key={update.id} className="border rounded p-3">
                        <div className="text-xs text-gray-500 mb-1">
                          {update.orderNumber} • {update.updateType} •{" "}
                          {new Date(update.createdAt).toLocaleString("id-ID")}
                        </div>
                        {update.mediaUrl && update.mediaType === "IMAGE" ? (
                          <div className="mb-2">
                            <Image
                              src={update.mediaUrl}
                              alt={update.caption || "Dokumentasi servis"}
                              width={640}
                              height={360}
                              className="max-h-48 rounded border object-cover"
                            />
                          </div>
                        ) : null}
                        {update.mediaUrl && update.mediaType === "VIDEO" ? (
                          <div className="mb-2">
                            <video src={update.mediaUrl} controls className="max-h-52 rounded border" />
                          </div>
                        ) : null}
                        {update.mediaUrl ? (
                          <div className="text-xs mb-1">
                            <a
                              className="text-blue-600 hover:underline"
                              href={update.mediaUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Buka media
                            </a>
                            {update.caption ? <span className="text-gray-500"> - {update.caption}</span> : null}
                          </div>
                        ) : null}
                        {update.directNote ? (
                          <div className="text-sm text-gray-700">{update.directNote}</div>
                        ) : (
                          <div className="text-sm text-gray-500">Tidak ada direct note.</div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          Mekanik: {update.mechanicName || update.mechanicEmail}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Belum ada live status servis untuk customer ini.</div>
                )}
              </div>

              {customer.postServiceCare && (
                <div className="mt-6 space-y-4 border rounded p-4">
                  <div>
                    <h2 className="font-semibold">Post-Service Care</h2>
                    <p className="text-xs text-gray-500">
                      Panduan personal pasca servis, countdown servis berikutnya, dan feedback lanjutan.
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="border rounded p-3">
                      <div className="text-xs text-gray-500 mb-1">Next Service Countdown</div>
                      {customer.postServiceCare.nextServiceCountdown.nextServiceDate ? (
                        <>
                          <div className="text-sm">
                            Estimasi servis berikutnya:{" "}
                            {new Date(
                              customer.postServiceCare.nextServiceCountdown.nextServiceDate
                            ).toLocaleDateString("id-ID")}
                          </div>
                          <div className="text-sm">
                            Estimasi kilometer:{" "}
                            {customer.postServiceCare.nextServiceCountdown.estimatedKilometer.toLocaleString(
                              "id-ID"
                            )}{" "}
                            km
                          </div>
                          <div className="text-sm">
                            Sisa hari: {customer.postServiceCare.nextServiceCountdown.daysRemaining ?? "-"}
                          </div>
                          <div className="text-xs text-gray-600">
                            Status: {customer.postServiceCare.nextServiceCountdown.status}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-500">Belum ada data servis selesai.</div>
                      )}
                    </div>
                    <div className="border rounded p-3">
                      <div className="text-xs text-gray-500 mb-1">Panduan Personal</div>
                      <ul className="text-sm list-disc pl-5 space-y-1">
                        {customer.postServiceCare.personalizedGuide.map((tip, i) => (
                          <li key={`${tip}-${i}`}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="border rounded p-3">
                    <div className="text-sm font-medium mb-2">DIY Knowledge Base</div>
                    <div className="grid gap-2 md:grid-cols-2">
                      {customer.postServiceCare.diyKnowledgeBase.map((item) => (
                        <a
                          key={item.id}
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="border rounded p-2 hover:bg-gray-50"
                        >
                          <div className="text-xs text-gray-500">{item.type}</div>
                          <div className="text-sm text-blue-700">{item.title}</div>
                          <div className="text-xs text-gray-500">{item.tags.join(", ")}</div>
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="border rounded p-3 space-y-3">
                    <div>
                      <div className="text-sm font-medium">Feedback Loop</div>
                      <p className="text-xs text-gray-500">
                        Pertanyaan lanjutan customer terkait hasil servis dan jawaban dari tim bengkel.
                      </p>
                    </div>

                    <form onSubmit={submitFeedbackQuestion} className="space-y-2">
                      <select
                        className="w-full border rounded px-3 py-2 text-sm"
                        value={feedbackServiceOrderId}
                        onChange={(e) => setFeedbackServiceOrderId(e.target.value)}
                      >
                        <option value="">Pilih order terkait (opsional)</option>
                        {customer.serviceOrders.map((order) => (
                          <option key={order.id} value={order.id}>
                            {order.orderNumber} - {order.serviceType}
                          </option>
                        ))}
                      </select>
                      <textarea
                        className="w-full border rounded px-3 py-2 text-sm"
                        rows={3}
                        value={feedbackQuestion}
                        onChange={(e) => setFeedbackQuestion(e.target.value)}
                        placeholder="Contoh: setelah ganti oli, apakah normal jika suara mesin masih agak kasar di pagi hari?"
                      />
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-3 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-60"
                      >
                        Kirim Pertanyaan
                      </button>
                    </form>

                    {feedbackMessage ? (
                      <div className="text-xs text-gray-600">{feedbackMessage}</div>
                    ) : null}

                    <div className="space-y-2">
                      {customer.postServiceCare.feedbackLoop.length ? (
                        customer.postServiceCare.feedbackLoop.map((fb) => (
                          <div key={fb.id} className="border rounded p-3">
                            <div className="text-xs text-gray-500 mb-1">
                              {fb.orderNumber || "-"} • {new Date(fb.askedAt).toLocaleString("id-ID")} •{" "}
                              {fb.status}
                            </div>
                            <div className="text-sm text-gray-800">{fb.question}</div>
                            {fb.answer ? (
                              <div className="text-sm text-green-700 mt-1">
                                Jawaban: {fb.answer} ({fb.answeredBy || "Tim"})
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 mt-1">Belum ada jawaban.</div>
                            )}

                            {hasAnyPermission(["crm_manage", "mechanic_notes_create"]) && !fb.answer ? (
                              <div className="mt-2 space-y-2">
                                <textarea
                                  className="w-full border rounded px-2 py-1 text-sm"
                                  rows={2}
                                  value={answerDraft[fb.id] || ""}
                                  onChange={(e) =>
                                    setAnswerDraft((prev) => ({ ...prev, [fb.id]: e.target.value }))
                                  }
                                  placeholder="Balas pertanyaan customer..."
                                />
                                <button
                                  type="button"
                                  onClick={() => submitFeedbackAnswer(fb.id)}
                                  disabled={submitting || !answerDraft[fb.id]?.trim()}
                                  className="px-3 py-1 bg-emerald-600 text-white rounded text-xs disabled:opacity-60"
                                >
                                  Kirim Jawaban
                                </button>
                              </div>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500">Belum ada pertanyaan lanjutan.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
