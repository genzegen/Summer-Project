from django.db import models
from django.contrib.auth.models import User
import string
import random

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField(blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)

    def __str__(self):
        return self.user.username
    
class ContactMessage(models.Model):
    MESSAGE_TYPES = [
        ("contact", "Contact"),
        ("request_model", "Request Model"),
    ]

    name = models.CharField(max_length=255)
    email = models.EmailField()
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPES, default="contact")
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.get_message_type_display()}"
    
def generate_unique_room_id():
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    
class RoomDesigns(models.Model):
    room_id = models.CharField(max_length=8, unique=True, default=generate_unique_room_id)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=200, default="My Room")
    description = models.TextField(blank=True, null=True)
    length = models.FloatField(blank=True, null=True)
    breadth = models.FloatField(blank=True, null=True)
    height = models.FloatField(default=15, blank=True, null=True)
    floor_color = models.CharField(max_length=20, default="#ffffff", blank=True, null=True)
    wall_color = models.CharField(max_length=20, default="#ffffff", blank=True, null=True)
    data = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    screenshot = models.ImageField(upload_to='screenshots/', null=True, blank=True)
    
    def __str__(self):
        return self.title

class PublicPost(models.Model):
    room_design = models.ForeignKey(RoomDesigns, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    description = models.TextField(blank=True, null=True)
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Post by {self.user.username} - {self.room_design.title}"
    
class AdminPanel(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    action = models.CharField(max_length=100)
    target = models.CharField(max_length=100)
    status = models.CharField(max_length=20, default="Pending")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Admin Action: {self.action} on {self.target}"
    
    
