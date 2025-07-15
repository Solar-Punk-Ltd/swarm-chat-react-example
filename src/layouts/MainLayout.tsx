import Logo from "@/assets/sp-logo.png";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { NetworkStatus } from "@/components/NetworkStatus/NetworkStatus";

import "./MainLayout.scss";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isOnline } = useNetworkStatus();

  return (
    <div className="main-layout" role="main-layout">
      <div className="upper-side"></div>
      <NetworkStatus isOnline={isOnline} />
      <div className="main-layout-header">
        <img src={Logo} alt="logo" className="logo" />
      </div>
      <div className="content">{children}</div>
    </div>
  );
}
