import { useState, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Zap, Download, Upload, Activity } from "lucide-react";

function formatBitsPerSec(bytesPerSec) {
  const mbps = (bytesPerSec * 8) / (1024 * 1024);
  return mbps.toFixed(1);
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
}

export default function SpeedTest({ onClose }) {
  const [status, setStatus] = useState("idle"); // idle | testing_ping | testing_download | testing_upload | done | error
  const [latency, setLatency] = useState(null);
  const [downloadSpeed, setDownloadSpeed] = useState(null);
  const [uploadSpeed, setUploadSpeed] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const runTest = useCallback(async () => {
    setStatus("testing_ping");
    setLatency(null);
    setDownloadSpeed(null);
    setUploadSpeed(null);
    setProgress(0);
    setError(null);

    try {
      // 1. Latency test (10 pings, average)
      let totalLatency = 0;
      let successPings = 0;
      for (let i = 0; i < 10; i++) {
        try {
          const start = performance.now();
          await api.get("/speedtest/ping");
          const elapsed = performance.now() - start;
          totalLatency += elapsed;
          successPings++;
        } catch {
          // skip failed pings
        }
      }
      const avgLatency = successPings > 0 ? totalLatency / successPings : 0;
      setLatency(Math.round(avgLatency));

      // 2. Download test (10MB)
      setStatus("testing_download");
      setProgress(0);
      const dlStart = performance.now();
      const controller = new AbortController();
      abortRef.current = controller;
      const response = await fetch(
        `${api.defaults.baseURL}/speedtest/test-file/10`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("netops_token") || ""}` },
          signal: controller.signal,
        }
      );
      const reader = response.body.getReader();
      let received = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.length;
        setProgress(Math.min((received / (10 * 1024 * 1024)) * 100, 100));
      }
      const dlElapsed = (performance.now() - dlStart) / 1000;
      const dlSpeed = received / dlElapsed;
      setDownloadSpeed(formatBitsPerSec(dlSpeed));
      setProgress(100);

      // 3. Upload test (10MB)
      setStatus("testing_upload");
      setProgress(0);
      const ulData = new Uint8Array(10 * 1024 * 1024); // 10MB of zeros
      const ulStart = performance.now();
      abortRef.current = new AbortController();
      await api.post("/speedtest/upload", ulData, {
        headers: { "Content-Type": "application/octet-stream" },
        signal: abortRef.current.signal,
        onUploadProgress: (e) => {
          if (e.total) setProgress((e.loaded / e.total) * 100);
        },
      });
      const ulElapsed = (performance.now() - ulStart) / 1000;
      const ulSpeed = ulData.length / ulElapsed;
      setUploadSpeed(formatBitsPerSec(ulSpeed));
      setProgress(100);

      setStatus("done");
    } catch (e) {
      if (e.name === "CanceledError" || e.name === "AbortError") {
        setError("Test cancelled");
      } else {
        setError(e.message || "Test failed");
      }
      setStatus("error");
    }
  }, []);

  const cancel = () => {
    if (abortRef.current) abortRef.current.abort();
    setStatus("idle");
  };

  return (
    <Card className="border-border">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <CardTitle className="font-display text-lg">Speed Test</CardTitle>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        {status === "idle" && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Test your connection speed to the BaglanOps server.
            </p>
            <Button onClick={runTest} className="gap-2" data-testid="speedtest-start">
              <Zap className="h-4 w-4" /> Start Speed Test
            </Button>
          </div>
        )}

        {(status === "testing_ping" || status === "testing_download" || status === "testing_upload") && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-sm font-medium">
                {status === "testing_ping" && "Testing latency…"}
                {status === "testing_download" && "Testing download speed…"}
                {status === "testing_upload" && "Testing upload speed…"}
              </div>
              <Progress value={progress} className="mt-3 h-2" />
            </div>
            <div className="flex justify-center">
              <Button variant="outline" size="sm" onClick={cancel}>Cancel</Button>
            </div>
          </div>
        )}

        {(status === "done" || status === "error") && (
          <div className="space-y-4">
            {error ? (
              <div className="text-center text-sm text-rose-500">{error}</div>
            ) : (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  <div className="font-label text-[9px] text-muted-foreground">LATENCY</div>
                  <div className="font-mono text-xl font-semibold">{latency} <span className="text-xs text-muted-foreground">ms</span></div>
                </div>
                <div className="space-y-1">
                  <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-emerald-500/10">
                    <Download className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="font-label text-[9px] text-muted-foreground">DOWNLOAD</div>
                  <div className="font-mono text-xl font-semibold text-emerald-500">{downloadSpeed} <span className="text-xs text-muted-foreground">Mbps</span></div>
                </div>
                <div className="space-y-1">
                  <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-500/10">
                    <Upload className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="font-label text-[9px] text-muted-foreground">UPLOAD</div>
                  <div className="font-mono text-xl font-semibold text-blue-500">{uploadSpeed} <span className="text-xs text-muted-foreground">Mbps</span></div>
                </div>
              </div>
            )}
            <div className="flex justify-center">
              <Button onClick={runTest} variant="outline" size="sm">
                Retest
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
