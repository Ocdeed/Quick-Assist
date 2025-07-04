# Generated by Django 5.2.3 on 2025-06-25 08:14

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_alter_user_user_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='serviceproviderprofile',
            name='service_offered',
            field=models.ForeignKey(blank=True, help_text='The single service this provider offers', null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.service'),
        ),
    ]
