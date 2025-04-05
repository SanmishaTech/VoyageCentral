import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import Joi from 'joi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { useNavigate } from 'react-router-dom';
import { post } from '@/services/apiService';
import { appName } from '@/config';
import { LoaderCircle } from 'lucide-react'; // Spinner icon
import { toast } from 'sonner';

type RegisterFormInputs = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

// Define Joi schema
const registerSchema = Joi.object({
  name: Joi.string().required().messages({
    'string.empty': 'Name is required',
  }),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Invalid email address',
    }),
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

const Register = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormInputs>({
    resolver: joiResolver(registerSchema),
  });

  const onSubmit: SubmitHandler<RegisterFormInputs> = async (data) => {
    setIsLoading(true);
    try {
      await post('/auth/register', data);
      toast.success('Registration successful! Please log in.');
      navigate('/'); // Redirect to login page
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
          <h1 className='text-2xl font-bold'>Create an Account</h1>
          <p className='text-balance text-muted-foreground'>
            Register for your {appName} account
          </p>
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='name'>Name</Label>
          <Input
            id='name'
            type='text'
            placeholder='John Doe'
            {...register('name')}
            required
          />
          {errors.name && (
            <span className='text-red-500'>{errors.name.message}</span>
          )}
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
          <p data-slot="form-description" className="text-muted-foreground text-sm">This is your public display name.</p>          
          {errors.email && (
            <p className="text-destructive text-sm">{errors.email.message}</p>
          )}
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='password'>Password</Label>
          <PasswordInput
            id='password'
            {...register('password')}
            required
          />
          {errors.password && (
            <p className="text-destructive text-sm">{errors.password.message}</p>
          )}
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='confirmPassword'>Confirm Password</Label>
          <PasswordInput
            id='confirmPassword'
            {...register('confirmPassword')}
            required
          />
          {errors.confirmPassword && (
            <p className="text-destructive text-sm">{errors.confirmPassword.message}</p>
          )}
        </div>
        <Button type='submit' className='w-full' disabled={isLoading}>
          {isLoading ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              Registering...
            </>
          ) : (
            'Register'
          )}
        </Button>
        <div className='text-center text-sm'>
          Already have an account?{' '}
          <a href='/' className='underline underline-offset-4'>
            Login
          </a>
        </div>
      </div>
    </form>
  );
};

export default Register;