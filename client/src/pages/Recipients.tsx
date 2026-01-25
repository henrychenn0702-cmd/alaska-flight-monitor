import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Recipients() {
  const [, setLocation] = useLocation();
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Query recipients
  const { data: recipients = [], refetch } = trpc.recipients.getAll.useQuery();

  // Mutations
  const addMutation = trpc.recipients.add.useMutation({
    onSuccess: () => {
      setNewEmail("");
      setNewName("");
      refetch();
      toast.success("收件人已新增");
    },
    onError: (error) => {
      toast.error(error.message || "新增失敗");
    },
  });

  const removeMutation = trpc.recipients.remove.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("收件人已移除");
    },
    onError: (error) => {
      toast.error(error.message || "移除失敗");
    },
  });

  const toggleMutation = trpc.recipients.toggle.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "切換失敗");
    },
  });

  const handleAddRecipient = async () => {
    if (!newEmail.trim()) {
      toast.error("請輸入email地址");
      return;
    }

    setIsAdding(true);
    try {
      await addMutation.mutateAsync({
        email: newEmail.trim(),
        name: newName.trim() || undefined,
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveRecipient = (id: number) => {
    if (confirm("確定要移除此收件人嗎?")) {
      removeMutation.mutate({ id });
    }
  };

  const handleToggleRecipient = (id: number) => {
    toggleMutation.mutate({ id });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">Email收件人管理</h1>
          </div>
          <p className="text-slate-600">
            管理接收特價里程票通知的email地址。所有活躍的收件人都會同時接收通知。
          </p>
        </div>

        {/* Add New Recipient */}
        <Card className="mb-6 border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">新增收件人</CardTitle>
            <CardDescription>輸入email地址和可選的名稱</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email地址 *
                </label>
                <Input
                  type="email"
                  placeholder="example@email.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={isAdding}
                  className="border-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  名稱 (選填)
                </label>
                <Input
                  type="text"
                  placeholder="例如: 張三"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  disabled={isAdding}
                  className="border-slate-200"
                />
              </div>
              <Button
                onClick={handleAddRecipient}
                disabled={isAdding || !newEmail.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                {isAdding ? "新增中..." : "新增收件人"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recipients List */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">
              收件人列表 ({recipients.length})
            </CardTitle>
            <CardDescription>
              {recipients.filter((r) => r.active === 1).length} 個活躍收件人
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recipients.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">還沒有收件人。新增第一個收件人開始接收通知吧!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recipients.map((recipient) => (
                  <div
                    key={recipient.id}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                      recipient.active === 1
                        ? "bg-blue-50 border-blue-200"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">
                        {recipient.name || "無名稱"}
                      </div>
                      <div className="text-sm text-slate-600">{recipient.email}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {new Date(recipient.createdAt).toLocaleDateString("zh-TW")} 新增
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleRecipient(recipient.id)}
                        className={`${
                          recipient.active === 1
                            ? "text-green-600 border-green-200 hover:bg-green-50"
                            : "text-slate-400 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {recipient.active === 1 ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveRecipient(recipient.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="mt-6">
          <Button
            variant="outline"
            onClick={() => setLocation("/")}
            className="border-slate-300 hover:bg-slate-100"
          >
            返回首頁
          </Button>
        </div>
      </div>
    </div>
  );
}
