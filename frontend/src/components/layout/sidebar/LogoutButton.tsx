import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { FaSignOutAlt } from 'react-icons/fa'
import ConfirmLogoutDialog from './ConfirmLogoutDialog'
import SidebarActionItem from './SidebarActionItem'

export default function LogoutButton() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState<boolean>(false)

  const handleClick = () => {
    setOpen(true)
  }

  const handleConfirm = async () => {
    await logout()
    navigate('/login')
    setOpen(false)
  }

  const handleCancel = () => {
    setOpen(false)
  }

  return (
    <>
      <SidebarActionItem icon={<FaSignOutAlt size={16} />} onClick={handleClick}>
        ログアウト
      </SidebarActionItem>
      <ConfirmLogoutDialog open={open} onConfirm={handleConfirm} onCancel={handleCancel} />
    </>
  )
}
