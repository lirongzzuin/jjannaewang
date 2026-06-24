import { useState } from "react";
import { useAppStore } from "@/store";
import NicknameModal from "@/components/ui/NicknameModal";

/**
 * First-run nickname setup. Opens once when a logged-in user hasn't set their
 * own nickname yet (nickname_set === false). Dismissible ("나중에").
 */
export default function NicknamePrompt() {
  const user = useAppStore((s) => s.user);
  const [dismissed, setDismissed] = useState(false);
  const open = !!user && user.nickname_set === false && !dismissed;
  return <NicknameModal open={open} firstTime onClose={() => setDismissed(true)} />;
}
