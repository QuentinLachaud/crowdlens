/**
 * Home page - Entry point for the CrowdLens application.
 * 
 * Renders the main AppShell which manages:
 * - Navigation between Photos and Map tabs
 * - Photo upload and organization
 * - Event management
 */

import AppShell from "@/components/AppShell";

export default function Home() {
  return <AppShell />;
}
