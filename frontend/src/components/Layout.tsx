import { Link, useLocation } from 'react-router-dom'
import { Users, BeakerIcon, FileText, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Experiments', href: '/experiments', icon: BeakerIcon },
  { name: 'Reports', href: '/reports', icon: FileText },
]

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-50 border-r border-gray-200">
        <div className="flex flex-col h-full">
          <div className="px-6 py-4">
            <h1 className="text-xl font-bold text-gray-900">Sapour Admin</h1>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname.startsWith(item.href === '/' ? '/' : item.href)
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
