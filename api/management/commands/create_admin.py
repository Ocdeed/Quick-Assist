from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()

class Command(BaseCommand):
    help = 'Create or promote a user to admin status'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            help='Username of the user to promote to admin',
            required=True
        )
        parser.add_argument(
            '--email',
            type=str,
            help='Email for the user (required if creating new user)',
        )
        parser.add_argument(
            '--password',
            type=str,
            help='Password for the user (required if creating new user)',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        username = options['username']
        email = options.get('email', '')
        password = options.get('password', '')

        try:
            # Try to get existing user
            user = User.objects.get(username=username)
            self.stdout.write(f"Found existing user: {username}")
            
            # Update to admin
            user.user_type = 'ADMIN'
            user.is_staff = True
            user.is_superuser = True
            user.save()
            
            self.stdout.write(
                self.style.SUCCESS(f'Successfully promoted user "{username}" to admin status')
            )
            
        except User.DoesNotExist:
            # Create new admin user
            if not email or not password:
                self.stdout.write(
                    self.style.ERROR('Email and password are required when creating a new user')
                )
                return
            
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                user_type='ADMIN',
                is_staff=True,
                is_superuser=True
            )
            
            self.stdout.write(
                self.style.SUCCESS(f'Successfully created admin user "{username}"')
            )
            
        # Display user info
        self.stdout.write(f"User details:")
        self.stdout.write(f"  Username: {user.username}")
        self.stdout.write(f"  Email: {user.email}")
        self.stdout.write(f"  User Type: {user.user_type}")
        self.stdout.write(f"  Is Staff: {user.is_staff}")
        self.stdout.write(f"  Is Superuser: {user.is_superuser}")
        self.stdout.write(f"  Is Active: {user.is_active}")
