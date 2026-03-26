import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';
import { Users, Shield, Eye, UserCheck } from 'lucide-react';
import clsx from 'clsx';

const ROLE_CONFIG = {
  admin: { label: 'Admin', icon: Shield, color: 'bg-purple-100 text-purple-800' },
  manager: { label: 'Manager', icon: Eye, color: 'bg-blue-100 text-blue-800' },
  field_rep: { label: 'Field Rep', icon: UserCheck, color: 'bg-green-100 text-green-800' },
};

export default function UsersPage() {
  const { data: profiles, isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');
      if (error) throw error;
      return data as Profile[];
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Users</h1>

      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
        </div>
      )}

      {profiles && profiles.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {profiles.map((profile) => {
            const roleConfig = ROLE_CONFIG[profile.role];
            const RoleIcon = roleConfig.icon;
            return (
              <div key={profile.id} className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-600">
                    {profile.full_name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{profile.full_name}</p>
                  <p className="text-xs text-gray-500">{profile.email}</p>
                </div>
                {profile.region && (
                  <span className="text-xs text-gray-400">{profile.region}</span>
                )}
                <span className={clsx('flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full', roleConfig.color)}>
                  <RoleIcon className="w-3 h-3" />
                  {roleConfig.label}
                </span>
              </div>
            );
          })}
        </div>
      ) : !isLoading ? (
        <div className="text-center py-12 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3" />
          <p className="text-sm">No users found</p>
        </div>
      ) : null}
    </div>
  );
}
