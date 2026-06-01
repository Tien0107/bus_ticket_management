import React from "react";
import CustomerProfileNav from "../../components/profile/CustomerProfileNav";
import CustomerProfileSectionHeader from "../../components/profile/CustomerProfileSectionHeader";

export default function MyTickets() {
  return (
    <div className="bg-surface min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <CustomerProfileSectionHeader title="Vé đã đặt" />
        <CustomerProfileNav />

        <div className="mt-10 flex flex-col items-center justify-center text-center">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">confirmation_number</span>
          <h2 className="text-2xl font-bold mb-2">My Tickets</h2>
          <p className="text-on-surface-variant">
            Trang này đang được làm lại. Vui lòng quay lại sau.
          </p>
        </div>
      </div>
    </div>
  );
}
