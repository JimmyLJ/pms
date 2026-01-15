import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth-client";
import { UserPlus, Users, TrendingUp, CheckCircle, Search } from "lucide-react";

export default function MembersPage() {
  const { workspaceId } = useParams();
  const [searchQuery, setSearchQuery] = useState("");

  // 获取组织成员
  const { data: membersData } = useQuery({
    queryKey: ["members", workspaceId],
    queryFn: async () => {
      const { data } = await authClient.organization.getFullOrganization({
        query: { organizationId: workspaceId }
      });
      return data;
    },
    enabled: !!workspaceId
  });

  const members = membersData?.members || [];
  const filteredMembers = members.filter(member =>
    member.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 统计数据（暂用静态数据）
  const stats = [
    { label: "成员总数", value: members.length, icon: Users, color: "bg-teal-100 text-teal-600" },
    { label: "活跃项目", value: 0, icon: TrendingUp, color: "bg-yellow-100 text-yellow-600" },
    { label: "任务总数", value: 0, icon: CheckCircle, color: "bg-purple-100 text-purple-600" },
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">团队</h2>
          <p className="text-muted-foreground">管理团队成员及其贡献</p>
        </div>
        <Button className="bg-blue-500 hover:bg-blue-600">
          <UserPlus className="mr-2 h-4 w-4" />
          邀请成员
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 搜索框 */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索团队成员..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* 成员表格 */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium">名称</th>
              <th className="text-left px-6 py-3 text-sm font-medium">邮箱</th>
              <th className="text-left px-6 py-3 text-sm font-medium">角色</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((member) => (
              <tr key={member.id} className="border-t">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.user.image || ""} />
                      <AvatarFallback className="bg-teal-500 text-white text-sm">
                        {member.user.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{member.user.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {member.user.email}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    member.role === "owner"
                      ? "bg-purple-100 text-purple-600"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {member.role === "owner" ? "管理员" : "成员"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
