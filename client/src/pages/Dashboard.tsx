import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Megaphone, Zap, BarChart3, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import PhoneManagement from "@/components/sections/PhoneManagement";
import CampaignSection from "@/components/sections/CampaignSection";
import AutomationSection from "@/components/sections/AutomationSection";
import DataSection from "@/components/sections/DataSection";

type Section = "phones" | "campaigns" | "automation" | "data";

const sections = [
  {
    id: "phones" as Section,
    label: "Gestion de Numeros",
    icon: Phone,
    color: "from-green-500 to-emerald-600",
  },
  {
    id: "campaigns" as Section,
    label: "Campanas",
    icon: Megaphone,
    color: "from-green-400 to-emerald-500",
  },
  {
    id: "automation" as Section,
    label: "Automatizacion IA",
    icon: Zap,
    color: "from-green-600 to-emerald-700",
  },
  {
    id: "data" as Section,
    label: "Datos & Analytics",
    icon: BarChart3,
    color: "from-green-500 to-teal-600",
  },
];

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState<Section>("phones");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderSection = () => {
    switch (activeSection) {
      case "phones":
        return <PhoneManagement />;
      case "campaigns":
        return <CampaignSection />;
      case "automation":
        return <AutomationSection />;
      case "data":
        return <DataSection />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col overflow-hidden`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">WhatsApp Pro</h1>
              <p className="text-xs text-muted-foreground">Manager</p>
            </div>
          </motion.div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {sections.map((section, index) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <motion.button
                key={section.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-lg shadow-green-500/20"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/10"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm">{section.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto w-2 h-2 bg-current rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <p className="text-xs text-muted-foreground text-center">v1.0.0</p>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shadow-sm">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </motion.button>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {sections.find((s) => s.id === activeSection)?.label}
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full" />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-6"
          >
            {renderSection()}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
