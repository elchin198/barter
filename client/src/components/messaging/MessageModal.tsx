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
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  recipient?: User;
  item?: Item | any;
  onSend?: (message: string) => void;
}

export default function MessageModal({ open, isOpen, onOpenChange, onClose, recipient, item, onSend }: MessageModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const actualOpen = open || isOpen || false;
  const handleClose = onClose || (onOpenChange ? () => onOpenChange(false) : undefined);
  
  const [message, setMessage] = useState("");
  
  // Combined send message handling for both internal and external usage
  const handleSendMessage = () => {
    if (!message.trim()) {
      toast({ 
        title: t('message.emptyMessage', 'Message is empty'),
        description: t('message.emptyMessageDescription', 'Please enter a message'),
        variant: "destructive"
      });
      return;
    }
    
    // If external onSend is provided, use that
    if (onSend) {
      onSend(message);
      setMessage("");
      if (handleClose) handleClose();
      return;
    }
    
    // Otherwise use internal sending logic
    if (recipient) {
      sendMessageMutation.mutate();
    }
  };
  
  // Internal message sending logic
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!recipient) return;
      
      await apiRequest('POST', '/api/conversations', {
        otherUserId: recipient.id,
        itemId: item?.id,
        message
      });
    },
    onSuccess: () => {
      toast({ 
        title: t('message.sentSuccess', 'Message sent'),
        description: t('message.sentSuccessDescription', 'Your message has been sent successfully') 
      });
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      if (onOpenChange) onOpenChange(false);
      if (onClose) onClose();
    },
    onError: (error) => {
      toast({ 
        title: t('message.sentError', 'Failed to send message'),
        description: error.message, 
        variant: "destructive" 
      });
    }
  });
  
  if (!user) return null;
  
  // If no recipient and no item, show a message
  const recipientName = recipient ? (recipient.fullName || recipient.username) : '';
  const itemTitle = item?.title || '';
  
  return (
    <Dialog open={actualOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            {t('message.sendMessageTo', 'Send message to')} {recipientName}
          </DialogTitle>
          <DialogDescription>
            {item ? (
              t('message.aboutItem', `About item: ${itemTitle}`)
            ) : (
              t('message.directMessage', 'Direct message')
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sender" className="text-right">
              {t('message.from', 'From')}
            </Label>
            <Input
              id="sender"
              value={user.fullName || user.username}
              className="col-span-3"
              disabled
            />
          </div>
          
          {recipient && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="recipient" className="text-right">
                {t('message.to', 'To')}
              </Label>
              <Input
                id="recipient"
                value={recipientName}
                className="col-span-3"
                disabled
              />
            </div>
          )}
          
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="message" className="text-right pt-2">
              {t('message.message', 'Message')}
            </Label>
            <Textarea
              id="message"
              placeholder={t('message.placeholder', 'Enter your message here...')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="col-span-3 resize-none"
              rows={5}
              maxLength={500}
            />
            <div className="col-span-4 col-start-2 text-xs text-gray-500">
              {message.length}/500 {t('message.characters', 'characters')}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={sendMessageMutation.isPending}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button 
            onClick={handleSendMessage}
            disabled={sendMessageMutation.isPending || !message.trim()}
          >
            {sendMessageMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('message.sending', 'Sending...')}
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                {t('message.send', 'Send')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}