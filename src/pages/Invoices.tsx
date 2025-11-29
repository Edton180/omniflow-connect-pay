import { AppLayout } from "@/components/layout/AppLayout";
import { InvoicesContent } from "@/components/invoices/InvoicesContent";

const Invoices = () => {

  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <InvoicesContent />
      </div>
    </AppLayout>
  );
};

export default Invoices;