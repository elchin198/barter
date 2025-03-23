import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Send, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { User, Item } from "@shared/schema";

interface MessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipient: User;
  item?: Item;
}

export default function MessageModal({ open, onOpenChange, recipient, item }: MessageModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  const [message, setMessage] = useState("");
  
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/conversations', {
        otherUserId: recipient.id,
        itemId: item?.id,
        message
      });
    },
    onSuccess: () => {
      toast({ 
        title: t('message.sentSuccess'),
        description: t('message.sentSuccessDescription') 
      });
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({ 
        title: t('message.sentError'),
        description: error.message, 
        variant: "destructive" 
      });
    }
  });
  
  const handleSendMessage = () => {
    if (!message.trim()) {
      toast({ 
        title: t('message.emptyMessage'),
        description: t('message.emptyMessageDescription'),
        variant: "destructive"
      });
      return;
    }
    
    sendMessageMutation.mutate();
  };
  
  if (!user) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            {t('message.sendMessageTo')} {recipient.fullName || recipient.username}
          </DialogTitle>
          <DialogDescription>
            {item ? (
              t('message.aboutItem', { item: item.title })
            ) : (
              t('message.directMessage')
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sender" className="text-right">
              {t('message.from')}
            </Label>
            <Input
              id="sender"
              value={user.fullName || user.username}
              className="col-span-3"
              disabled
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="recipient" className="text-right">
              {t('message.to')}
            </Label>
            <Input
              id="recipient"
              value={recipient.fullName || recipient.username}
              className="col-span-3"
              disabled
            />
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="message" className="text-right pt-2">
              {t('message.message')}
            </Label>
            <Textarea
              id="message"
              placeholder={t('message.placeholder')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="col-span-3 resize-none"
              rows={5}
              maxLength={500}
            />
            <div className="col-span-4 col-start-2 text-xs text-gray-500">
              {message.length}/500 {t('message.characters')}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={sendMessageMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleSendMessage}
            disabled={sendMessageMutation.isPending || !message.trim()}
          >
            {sendMessageMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('message.sending')}
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                {t('message.send')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}