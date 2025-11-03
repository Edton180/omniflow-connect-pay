import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Package } from "lucide-react";
import { PaymentGatewayList } from "@/components/payments/PaymentGatewayList";
import { PlansList } from "@/components/plans/PlansList";
import { AppLayout } from "@/components/layout/AppLayout";

export default function Payments() {
  return (
    <AppLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Pagamentos</h1>
          <p className="text-muted-foreground">Gerencie gateways e planos</p>
        </div>

        <Tabs defaultValue="gateways" className="space-y-6">
          <TabsList>
            <TabsTrigger value="gateways" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Gateways
            </TabsTrigger>
            <TabsTrigger value="plans" className="gap-2">
              <Package className="h-4 w-4" />
              Planos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gateways" className="space-y-4">
            <PaymentGatewayList />
          </TabsContent>

          <TabsContent value="plans" className="space-y-4">
            <PlansList />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
