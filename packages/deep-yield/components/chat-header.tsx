'use client'; import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts'; import { ModelSelector } from '@/components/model-selector';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { PlusIcon, VercelIcon } from './icons';
import { useSidebar } from './ui/sidebar';
import { memo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { VisibilityType, VisibilitySelector } from './visibility-selector';
import { useResearchPlanStore } from '@/lib/store/research-plan-store';
import { ResearchPlanToggle } from './research-plan-toggle'; function PureChatHeader({ chatId, selectedModelId, selectedVisibilityType, isReadonly,
}: { chatId: string; selectedModelId: string; selectedVisibilityType: VisibilityType; isReadonly: boolean;
}) { const router = useRouter(); const { open } = useSidebar(); const isResearchActive = useResearchPlanStore(state => state.isActive); const { width: windowWidth } = useWindowSize(); return ( <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2"> <SidebarToggle /> {(!open || windowWidth < 768) && ( <Tooltip> <TooltipTrigger asChild> <Button variant="outline" className="order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0" onClick={() => { router.push('/'); router.refresh(); }} > <PlusIcon /> <span className="md:sr-only">New Chat</span> </Button> </TooltipTrigger> <TooltipContent>New Chat</TooltipContent> </Tooltip> )} {!isReadonly && ( <ModelSelector selectedModelId={selectedModelId} className="order-1 md:order-2" /> )} {!isReadonly && ( <VisibilitySelector chatId={chatId} selectedVisibilityType={selectedVisibilityType} className="order-1 md:order-3" /> )} {isResearchActive && ( <div className="order-4 mx-2"> <ResearchPlanToggle /> </div> )} <Button className="bg-zinc-900 hover:bg-zinc-800 text-zinc-50 hidden md:flex py-1.5 px-2 h-fit md:h-[34px] order-5 md:ml-auto" asChild > <Link href={`https://vercel.com/new/clone?repository-url=https://github.com/vercel/ai-chatbot&env=AUTH_SECRET&envDescription=Learn more about how to get the API Keys for the application&envLink=https://github.com/vercel/ai-chatbot/blob/main/.env.example&demo-title=AI Chatbot&demo-description=An Open-Source AI Chatbot Template Built With Next.js and the AI SDK by Vercel.&demo-url=https://chat.vercel.ai&products=[{"type":"integration","protocol":"ai","productSlug":"grok","integrationSlug":"xai"},{"type":"integration","protocol":"ai","productSlug":"api-key","integrationSlug":"groq"},{"type":"integration","protocol":"storage","productSlug":"neon","integrationSlug":"neon"},{"type":"blob"}]`} target="_noblank" > <VercelIcon size={16} /> Deploy with Vercel </Link> </Button> </header> );
} export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => { return prevProps.selectedModelId === nextProps.selectedModelId;
});
