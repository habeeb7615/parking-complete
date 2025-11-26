import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeSubscriptionOptions {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema?: string;
  filter?: string;
  onDataChange?: (payload: any) => void;
  onError?: (error: Error) => void;
}

export function useRealtimeSubscription<T = any>({
  table,
  event = '*',
  schema = 'public',
  filter,
  onDataChange,
  onError,
}: UseRealtimeSubscriptionOptions) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let channel: RealtimeChannel;

    const setupSubscription = () => {
      setLoading(true);
      setError(null);

      channel = supabase
        .channel(`${table}-changes`)
        .on(
          'postgres_changes' as any,
          {
            event,
            schema,
            table,
            filter,
          },
          (payload) => {
            setData(payload as T);
            setLoading(false);
            if (onDataChange) {
              onDataChange(payload);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setLoading(false);
          } else if (status === 'CHANNEL_ERROR') {
            const error = new Error('Failed to subscribe to realtime updates');
            setError(error);
            setLoading(false);
            if (onError) {
              onError(error);
            }
          }
        });
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [table, event, schema, filter]);

  return { data, loading, error };
}

export function useRealtimePresence(channelName: string) {
  const [presenceState, setPresenceState] = useState<any>({});
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const channel = supabase.channel(channelName);

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        setPresenceState(newState);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsOnline(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      setIsOnline(false);
    };
  }, [channelName]);

  const trackPresence = async (userStatus: any) => {
    const channel = supabase.channel(channelName);
    return await channel.track(userStatus);
  };

  const untrackPresence = async () => {
    const channel = supabase.channel(channelName);
    return await channel.untrack();
  };

  return {
    presenceState,
    isOnline,
    trackPresence,
    untrackPresence,
  };
}