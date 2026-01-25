import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sliders, Plus, Trash2, Power, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function FilterSettings() {
  const [targetMiles, setTargetMiles] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const utils = trpc.useUtils();

  // Fetch filters
  const { data: filters, isLoading } = trpc.filters.getAll.useQuery();

  // Create filter mutation
  const createMutation = trpc.filters.create.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success("篩選器已新增", {
          description: `${targetMiles}k 里程票監控已啟用`,
        });
        setTargetMiles("");
        setDescription("");
        utils.filters.getAll.invalidate();
        utils.filters.getActive.invalidate();
      } else {
        toast.error("新增失敗", {
          description: result.error || "未知錯誤",
        });
      }
      setIsCreating(false);
    },
    onError: (error) => {
      toast.error("新增失敗", {
        description: error.message,
      });
      setIsCreating(false);
    },
  });

  // Toggle filter mutation
  const toggleMutation = trpc.filters.toggle.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.active ? "篩選器已啟用" : "篩選器已停用");
        utils.filters.getAll.invalidate();
        utils.filters.getActive.invalidate();
      }
    },
    onError: (error) => {
      toast.error("操作失敗", {
        description: error.message,
      });
    },
  });

  // Delete filter mutation
  const deleteMutation = trpc.filters.delete.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success("篩選器已刪除");
        utils.filters.getAll.invalidate();
        utils.filters.getActive.invalidate();
      }
    },
    onError: (error) => {
      toast.error("刪除失敗", {
        description: error.message,
      });
    },
  });

  const handleCreateFilter = () => {
    if (!targetMiles || isNaN(Number(targetMiles))) {
      toast.error("請輸入有效的里程數");
      return;
    }

    setIsCreating(true);
    createMutation.mutate({
      targetMiles: Number(targetMiles) * 1000,
      description: description || undefined,
    });
  };

  const handleToggle = (id: number) => {
    toggleMutation.mutate({ id });
  };

  const handleDelete = (id: number) => {
    if (confirm("確定要刪除此篩選器嗎?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sliders className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">篩選器設定</h1>
              <p className="text-sm text-muted-foreground">自訂要監控的里程票價格</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Create New Filter */}
        <Card className="border-2 shadow-sm mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              新增篩選器
            </CardTitle>
            <CardDescription>
              設定一個新的里程票價格監控目標
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="miles" className="text-sm font-medium">
                    里程數 (k)
                  </Label>
                  <Input
                    id="miles"
                    type="number"
                    placeholder="例如: 75"
                    value={targetMiles}
                    onChange={(e) => setTargetMiles(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="desc" className="text-sm font-medium">
                    描述 (選填)
                  </Label>
                  <Input
                    id="desc"
                    type="text"
                    placeholder="例如: 特價票"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleCreateFilter}
                    disabled={isCreating || !targetMiles}
                    className="w-full"
                  >
                    {isCreating ? "新增中..." : "新增篩選器"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Filters Info */}
        {filters && filters.length > 0 && (
          <Card className="border-2 shadow-sm mb-8 bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-blue-900">
                    目前監控 {filters.filter(f => f.active === 1).length} 個里程票價格
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    系統每15分鐘自動檢查一次,發現特價票時立即通知
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters List */}
        <Card className="border-2 shadow-sm">
          <CardHeader>
            <CardTitle>篩選器列表</CardTitle>
            <CardDescription>
              {isLoading ? "載入中..." : `共 ${filters?.length || 0} 個篩選器`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">載入中...</div>
            ) : filters && filters.length > 0 ? (
              <div className="space-y-3">
                {filters.map((filter) => (
                  <div
                    key={filter.id}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                      filter.active === 1
                        ? "bg-green-50 border-green-200"
                        : "bg-gray-50 border-gray-200 opacity-60"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-lg font-bold text-foreground">
                          {filter.targetMiles / 1000}k
                        </span>
                        {filter.description && (
                          <span className="text-sm text-muted-foreground">
                            {filter.description}
                          </span>
                        )}
                        <Badge
                          variant={filter.active === 1 ? "default" : "secondary"}
                          className="ml-auto"
                        >
                          {filter.active === 1 ? "啟用中" : "已停用"}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        建立於 {new Date(filter.createdAt).toLocaleString("zh-TW")}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggle(filter.id)}
                        disabled={toggleMutation.isPending}
                        className={
                          filter.active === 1
                            ? "text-amber-600 hover:text-amber-700"
                            : "text-green-600 hover:text-green-700"
                        }
                      >
                        <Power className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(filter.id)}
                        disabled={deleteMutation.isPending}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground mb-4">
                  尚未設定任何篩選器
                </p>
                <p className="text-sm text-muted-foreground">
                  請在上方新增篩選器以開始監控特定里程票價格
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="border-2 shadow-sm mt-8">
          <CardHeader>
            <CardTitle className="text-base">使用說明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              • 輸入您想監控的里程數(例如75表示75k里程票),系統會自動檢查此價格是否出現
            </p>
            <p>
              • 可以新增多個篩選器同時監控不同的里程票價格
            </p>
            <p>
              • 使用「啟用/停用」按鈕來控制是否監控某個篩選器
            </p>
            <p>
              • 系統每15分鐘自動檢查一次,發現符合篩選器的特價票時會立即發送email通知
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
