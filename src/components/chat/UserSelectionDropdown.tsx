import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

interface UserSelectionDropdownProps {
  tenantId: string;
  currentUserId: string;
  value: string | null;
  onValueChange: (userId: string) => void;
}

export function UserSelectionDropdown({ 
  tenantId, 
  currentUserId, 
  value, 
  onValueChange 
}: UserSelectionDropdownProps) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, [tenantId]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("tenant_id", tenantId)
        .neq("id", currentUserId);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedUser = users.find((u) => u.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedUser ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={selectedUser.avatar_url} />
                <AvatarFallback>
                  {selectedUser.full_name?.charAt(0) || <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <span>{selectedUser.full_name || "Sem nome"}</span>
            </div>
          ) : (
            "Selecione um usuário..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar usuário..." />
          <CommandList>
            <CommandEmpty>
              {loading ? "Carregando..." : "Nenhum usuário encontrado"}
            </CommandEmpty>
            <CommandGroup>
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  value={user.id}
                  onSelect={() => {
                    onValueChange(user.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === user.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback>
                      {user.full_name?.charAt(0) || <User className="h-3 w-3" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span>{user.full_name || "Sem nome"}</span>
                    {user.phone && (
                      <span className="text-xs text-muted-foreground">{user.phone}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
