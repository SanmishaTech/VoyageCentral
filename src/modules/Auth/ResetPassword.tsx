import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import Joi from 'joi';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { useNavigate, useParams } from 'react-router-dom'; // Import useParams
import { post } from '@/services/apiService';
import { LoaderCircle } from 'lucide-react'; // Import the spinner icon
import { toast } from 'sonner';

type ResetPasswordFormInputs = {
  password: string;
  confirmPassword: string;
};

// Define Joi schema
const resetPasswordSchema = Joi.object({
  password: Joi.string().min(6).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters long',
  }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords must match',
      'string.empty': 'Confirm Password is required',
    }),
});

const ResetPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormInputs>({
    resolver: joiResolver(resetPasswordSchema),
  });
  const navigate = useNavigate();
  const { token } = useParams(); // Extract the token from the URL path

  const onSubmit: SubmitHandler<ResetPasswordFormInputs> = async (data) => {
    setIsLoading(true);
    try {
      if (!token) {
        toast.error('Invalid or missing reset token');
        return;
      }

      const payload = {
        password: data.password,
        token, // Use the token from the URL
      };

      await post('/auth/reset-password', payload);
      toast.success('Password reset successful!');
      navigate('/');
    } catch (error: any) {
      if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className='p-6 md:p-8' onSubmit={handleSubmit(onSubmit)}>
      <div className='flex flex-col gap-6'>
        <div className='flex flex-col items-center text-center'>
          <h1 className='text-2xl font-bold'>Reset Password</h1>
          <p className='text-balance text-muted-foreground'>
            Enter your new password to reset your account
          </p>
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='password'>New Password</Label>
          <PasswordInput
            id='password'
            type='password'
            placeholder='Enter new password'
            {...register('password')}
            required
          />
          {errors.password && (
            <span className='text-red-500'>{errors.password.message}</span>
          )}
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='confirmPassword'>Confirm Password</Label>
          <PasswordInput
            id='confirmPassword'
            type='password'
            placeholder='Confirm new password'
            {...register('confirmPassword')}
            required
          />
          {errors.confirmPassword && (
            <span className='text-red-500'>{errors.confirmPassword.message}</span>
          )}
        </div>
        <Button type='submit' className='w-full' disabled={isLoading}>
          {isLoading ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              Resetting...
            </>
          ) : (
            'Reset Password'
          )}
        </Button>
      </div>
    </form>
  );
};

export default ResetPassword;