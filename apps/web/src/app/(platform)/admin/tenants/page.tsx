import { TenantList } from "@/features/admin/components/tenant-list";

export default function AdminTenantsPage() {
    return (
        <>
            <div className="admin-page-heading">
                <div>
                    <span className="eyebrow">PLATFORM DIRECTORY</span>
                    <h1>Tenants</h1>
                    <p>Review workspace activity and manage access.</p>
                </div>
            </div>
            <TenantList />
        </>
    );
}
