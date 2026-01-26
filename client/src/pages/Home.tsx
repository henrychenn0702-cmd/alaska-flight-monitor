import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plane, RefreshCw, Calendar, TrendingDown, Bell, Activity, CheckCircle2, XCircle, Sparkles, Sliders, Mail } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const [isChecking, setIsChecking] = useState(false);
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  // Fetch data
  const { data: stats, isLoading: statsLoading } = trpc.monitor.getStats.useQuery();
  const { data: prices, isLoading: pricesLoading } = trpc.monitor.getLatestPrices.useQuery();
  const { data: logs, isLoading: logsLoading } = trpc.monitor.getRecentLogs.useQuery();
  const { data: notifications } = trpc.monitor.getNotifications.useQuery();
  const { data: dealsByFilter } = trpc.monitor.getDealsByFilter.useQuery();

  // Auto-refresh every 15 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      utils.monitor.getStats.invalidate();
      utils.monitor.getLatestPrices.invalidate();
      utils.monitor.getRecentLogs.invalidate();
      utils.monitor.getNotifications.invalidate();
      utils.monitor.getDealsByFilter.invalidate();
    }, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [utils]);

  // Manual check mutation
  const runCheck = trpc.monitor.runCheck.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        if (result.dealsFound > 0) {
          toast.success(`發現 ${result.dealsFound} 個 75k 特價票!`, {
            description: result.dealDates.join(", "),
          });
        } else {
          toast.success("檢查完成", {
            description: `已檢查 ${result.datesChecked} 個日期,暫無特價票`,
          });
        }
        // Invalidate all queries to refresh data
        utils.monitor.getStats.invalidate();
        utils.monitor.getLatestPrices.invalidate();
        utils.monitor.getRecentLogs.invalidate();
        utils.monitor.getNotifications.invalidate();
      } else {
        toast.error("檢查失敗", {
          description: result.error || "未知錯誤",
        });
      }
      setIsChecking(false);
    },
    onError: (error) => {
      toast.error("檢查失敗", {
        description: error.message,
      });
      setIsChecking(false);
    },
  });

  const handleManualCheck = () => {
    setIsChecking(true);
    runCheck.mutate();
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" />成功</Badge>;
      case "found_deal":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200"><Sparkles className="w-3 h-3 mr-1" />發現特價</Badge>;
      case "error":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />錯誤</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Plane className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">阿拉斯加航空里程票監控系統</h1>
                <p className="text-sm text-muted-foreground">SEA → TPE · 2026年2月 · Partner Business</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleManualCheck}
                disabled={isChecking}
                size="lg"
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isChecking ? "animate-spin" : ""}`} />
                {isChecking ? "檢查中..." : "立即檢查"}
              </Button>
              <Button
                onClick={() => navigate("/filters")}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <Sliders className="w-4 h-4" />
                篩選器設定
              </Button>
              <Button
                onClick={() => navigate("/recipients")}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <Mail className="w-4 h-4" />
                收件人設定
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4" />
                總檢查次數
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {statsLoading ? "..." : stats?.totalChecks || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                成功檢查
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {statsLoading ? "..." : stats?.successfulChecks || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                發現篩選器的票
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">
                {statsLoading ? "..." : stats?.totalDealsFound || 0}
              </div>
              {dealsByFilter && Object.keys(dealsByFilter).length > 0 && (
                <div className="mt-2 space-y-1">
                  {Object.entries(dealsByFilter).map(([miles, count]) => (
                    <div key={miles} className="text-xs text-muted-foreground flex justify-between">
                      <span>{Number(miles) / 1000}k:</span>
                      <span className="font-semibold">{count}張</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Bell className="w-4 h-4" />
                發送通知
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {notifications?.length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Latest Prices */}
          <Card className="border-2 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                最新價格
              </CardTitle>
              <CardDescription>
                {stats?.lastCheck
                  ? `最後檢查: ${formatDate(stats.lastCheck.checkedAt)}`
                  : "尚未進行檢查"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                {pricesLoading ? (
                  <div className="text-center text-muted-foreground py-8">載入中...</div>
                ) : prices && prices.length > 0 ? (
                  <div className="space-y-3">
                    {prices.map((price) => (
                      <div
                        key={price.flightDate}
                        className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                          price.miles === 75000
                            ? "bg-amber-50 border-amber-300 shadow-md"
                            : "bg-card border-border hover:border-primary/50"
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-foreground">{price.flightDate}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(price.recordedAt)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-lg font-bold ${
                              price.miles === 75000 ? "text-amber-600" : "text-foreground"
                            }`}
                          >
                            {(price.miles / 1000).toFixed(0)}k
                          </div>
                          <div className="text-sm text-muted-foreground">+ ${price.fees}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    暫無價格數據,請點擊「立即檢查」開始監控
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Monitor Logs */}
          <Card className="border-2 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                監控日誌
              </CardTitle>
              <CardDescription>最近 50 次檢查記錄</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                {logsLoading ? (
                  <div className="text-center text-muted-foreground py-8">載入中...</div>
                ) : logs && logs.length > 0 ? (
                  <div className="space-y-3">
                    {logs.map((log) => (
                      <div key={log.id} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-start justify-between mb-2">
                          {getStatusBadge(log.status)}
                          <div className="text-xs text-muted-foreground">
                            {formatDate(log.checkedAt)}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          檢查 {log.datesChecked || 0} 個日期
                          {log.dealsFound && log.dealsFound > 0 && (
                            <span className="text-amber-600 font-semibold ml-2">
                              · 發現 {log.dealsFound} 個特價票
                            </span>
                          )}
                        </div>
                        {log.errorMessage && (
                          <div className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded">
                            {log.errorMessage}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    暫無監控記錄
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Notifications Section */}
        {notifications && notifications.length > 0 && (
          <Card className="border-2 shadow-sm mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                通知記錄
              </CardTitle>
              <CardDescription>所有發送的特價票通知</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notif) => (
                  <div key={notif.id} className="p-4 rounded-lg border-2 border-amber-200 bg-amber-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-semibold text-amber-900">{notif.title}</div>
                      <Badge variant={notif.sent ? "default" : "secondary"}>
                        {notif.sent ? "已發送" : "發送失敗"}
                      </Badge>
                    </div>
                    <div className="text-sm text-amber-800 whitespace-pre-wrap mb-2">
                      {notif.content}
                    </div>
                    <div className="text-xs text-amber-600">
                      {formatDate(notif.sentAt)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm mt-12">
        <div className="container py-6 text-center text-sm text-muted-foreground">
          <p>自動每 15 分鐘檢查一次 · 發現 75k 特價票立即通知</p>
        </div>
      </footer>
    </div>
  );
}
