import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import Joi from 'joi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { useNavigate } from 'react-router-dom';
import { post } from '@/services/apiService';
import { appName, allowRegistration } from '@/config';
import { LoaderCircle } from 'lucide-react'; // Import the spinner icon
import { toast } from 'sonner';

type LoginFormInputs = {
  email: string;
  password: string;
};

// Define Joi schema
const loginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Invalid email address',
    }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
  }),
});

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.unauthorized) {
      toast.error('You are not authorized.');
      // Clear the state after displaying the toast
      setTimeout(() => {
        navigate(location.pathname, { replace: true });
      }, 0); // Use a timeout to ensure the state is cleared after the toast is displayed
    }
  }, [location, navigate]);

  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>({
    resolver: joiResolver(loginSchema),
  });

  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    setIsLoading(true);
    try {
      const response = await post('/auth/login', data);
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      navigate('/dashboard');
      toast.success('Login successful!');
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
          <h1 className='text-2xl font-bold'>Welcome back</h1>
          <p className='text-balance text-muted-foreground'>
            Login to your {appName} account
          </p>
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='email'>Email</Label>
          <Input
            id='email'
            type='email'
            placeholder='m@example.com'
            {...register('email')}
            required
          />
          {errors.email && (
            <span className='text-red-500'>{errors.email.message}</span>
          )}
        </div>
        <div className='grid gap-2'>
          <div className='flex items-center'>
            <Label htmlFor='password'>Password</Label>
            <a
              href='/forgot-password'
              className='ml-auto text-sm underline-offset-2 hover:underline'
            >
              Forgot your password?
            </a>
          </div>
          <PasswordInput
            id='password'
            {...register('password')}
            required
          />
          {errors.password && (
            <span className='text-red-500'>{errors.password.message}</span>
          )}
        </div>
        <Button type='submit' className='w-full' disabled={isLoading}>
          {isLoading ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              Login...
            </>
          ) : (
            'Login'
          )}
        </Button>
        {allowRegistration && (
          <div className='text-center text-sm'>
            Don&apos;t have an account?{' '}
            <a href='/register' className='underline underline-offset-4'>
              Register
            </a>
          </div>
        )}
      </div>
    </form>
  );
};

export default Login;
