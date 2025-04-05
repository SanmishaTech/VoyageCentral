import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import Joi from 'joi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { post } from '@/services/apiService';
import { appName } from '@/config';
import { LoaderCircle } from 'lucide-react'; // Import the spinner icon
import { toast } from 'sonner';

type ForgotPasswordFormInputs = {
	email: string;
};

// Define Joi schema
const forgotPasswordSchema = Joi.object({
	email: Joi.string()
		.email({ tlds: { allow: false } })
		.required()
		.messages({
			'string.empty': 'Email is required',
			'string.email': 'Invalid email address',
		}),
});

const ForgotPassword = () => {
	const [isLoading, setIsLoading] = useState(false);
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ForgotPasswordFormInputs>({
		resolver: joiResolver(forgotPasswordSchema),
	});
	const navigate = useNavigate();

	const onSubmit: SubmitHandler<ForgotPasswordFormInputs> = async (data) => {
		setIsLoading(true);
		try {
			const payload = {
				...data,
				resetUrl: `${window.location.origin}/reset-password`, // Construct the reset password URL
			};
			await post('/auth/forgot-password', payload);
			toast.success('Password reset email sent!');
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
					<h1 className='text-2xl font-bold'>Forgot Password</h1>
					<p className='text-balance text-muted-foreground'>
						Enter your email to reset your {appName} account password
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
				<Button type='submit' className='w-full' disabled={isLoading}>
					{isLoading ? (
						<>
							<LoaderCircle className='mr-2 h-4 w-4 animate-spin' />
							Sending...
						</>
					) : (
						'Send Reset Link'
					)}
				</Button>
				<div className='text-center text-sm'>
					Remembered your password?{' '}
					<a href='/' className='underline underline-offset-4'>
						Login
					</a>
				</div>
			</div>
		</form>
	);
};

export default ForgotPassword;
