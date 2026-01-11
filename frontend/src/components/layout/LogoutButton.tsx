import { useState } from 'react'
import { Button } from '../ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { FaSignOutAlt } from 'react-icons/fa'
import ConfirmLogoutDialog from './ConfirmLogoutDialog'

export default function LogoutButton() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState<boolean>(false)

  const handleClick = () => {
    setOpen(true)
  }

  const handleConfirm = () => {
    logout()
    navigate('/login')
    setOpen(false)
  }

  const handleCancel = () => {
    setOpen(false)
  }

  return (
    <>
      <Button
        variant="ghost"
        className="w-full justify-start gap-3 rounded-xl px-3.5 mb-2  text-left text-[15px]  hover:bg-neutral-100 hover:text-neutral-800"
        onClick={handleClick}
      >
        <FaSignOutAlt size={16} />
        ログアウト
      </Button>
      <ConfirmLogoutDialog open={open} onConfirm={handleConfirm} onCancel={handleCancel} />
    </>
  )
}
