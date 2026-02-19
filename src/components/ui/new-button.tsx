import { ButtonHTMLAttributes } from 'react';

interface NeuButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const NeuButton = ({ children, className, ...props }: NeuButtonProps) => {
  return (
    <button 
      className={`px-6 py-2 font-medium bg-[#005EB8] text-white w-fit transition-all shadow-[3px_3px_0px_black] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] rounded-md ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default NeuButton;