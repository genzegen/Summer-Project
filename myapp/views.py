from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required, user_passes_test
from django.views.decorators.http import require_http_methods, require_POST
from django.contrib.auth.hashers import check_password
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.models import User
from .models import *
from django.contrib import messages
from django.conf import settings
from django.http import JsonResponse, HttpResponseForbidden, HttpResponseNotFound
from django.views.decorators.csrf import csrf_exempt
import json
import os
from django.shortcuts import get_object_or_404
from django.contrib.auth.views import LoginView
from django.contrib.auth.forms import AuthenticationForm
from django.views.decorators.csrf import csrf_protect
from django.utils.decorators import method_decorator
from django.contrib.auth import authenticate, login as auth_login, logout
from django.views.decorators.cache import never_cache


def intro(request):
    return render(request, 'intro.html')

def about(request):
    return render(request, 'about.html')

def contact(request):
    if request.method == "POST":
        name = request.POST.get("name")
        email = request.POST.get("email")
        message = request.POST.get("message")
        message_type = request.POST.get("message_type")

        if name and email and message:
            ContactMessage.objects.create(
                name=name, 
                email=email, 
                message_type=message_type,
                message=message
            )
            
            if message_type == "contact":
                messages.success(request, "Your message has been sent successfully!")
            elif message_type == "request_model":
                messages.success(request, "Your model request has been submitted successfully!")

            return redirect("contact")
        else:
            messages.error(request, "All fields are required.")

    return render(request, "contact.html")

def help(request):
    return render(request, 'help.html')

def getStarted(request):
    if request.method == 'POST':
        form_type = request.POST.get('form_type')

        if form_type == 'logout':
            logout(request)
            return redirect('intro')

        if form_type == 'login':

            username = request.POST.get('username', '')
            password = request.POST.get('password', '')

            if username and password:
                user = authenticate(request, username=username, password=password)
                if user is not None:
                    login(request, user)
                    return redirect('mainpage')
                else:
                    messages.error(request, "Invalid Credentials!")
            else:
                messages.error(request, "Username and Password are required!")

        elif form_type == 'register':
            username = request.POST.get('username', '')
            email = request.POST.get('email', '')
            password1 = request.POST.get('password1', '')
            password2 = request.POST.get('password2', '')

            if username and email and password1 and password2:
                if password1 == password2:
                    if not User.objects.filter(username=username).exists():
                        user = User.objects.create_user(username=username, email=email, password=password1)
                        user.save()
                        UserProfile.objects.create(user=user)
                        messages.success(request, "Registration successful! Please log in.")
                    else:
                        messages.error(request, "Username already exists!")
                else:
                    messages.error(request, "Passwords do not match!")
            else:
                messages.error(request, "All fields are required!")

    return render(request, 'getStarted.html')

def home(request):
    return render(request, "partials/home.html")

def my_projects(request):
    return render(request, "partials/my-projects.html")

def generate_unique_room_id():
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))

@login_required
def templates(request):
    """Displays room templates and allows users to create a new project from a template."""
    
    json_file_path = os.path.join(settings.BASE_DIR, 'myapp', 'static', 'data', 'templates.json')

    try:
        with open(json_file_path, 'r', encoding='utf-8') as file:
            templates = json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        templates = []

    if request.method == "POST":
        template_id = request.POST.get('template_id')

        # Find the selected template
        selected_template = next((t for t in templates if t["template_id"] == template_id), None)
        
        if selected_template:
            new_room_id = generate_unique_room_id()  # Generate a new unique room ID

            # Create a new project using template data
            new_room = RoomDesigns.objects.create(
                user=request.user,
                room_id=new_room_id,
                title=selected_template["title"] + " (Copy)",
                description=selected_template["description"],
                length=selected_template["length"],
                breadth=selected_template["breadth"],
                floor_color=selected_template["floor_color"],
                wall_color=selected_template["wall_color"],
                data={"furniture": selected_template["furniture"]},  # Store furniture data
            )

            # Redirect to create page for the newly created project
            return redirect('createpage', project_id=new_room.room_id)  

    return render(request, 'partials/templates.html', {'templates': templates})

def community(request):
    return render(request, "community.html")

@login_required
def settings_view(request):
    try:
        profile = UserProfile.objects.get(user=request.user)
    except UserProfile.DoesNotExist:
        profile = UserProfile.objects.create(user=request.user)

    if request.method == "POST":
        bio = request.POST.get('bio', '').strip()
        profile.bio = bio

        # Profile Picture Update
        if "profile_picture" in request.FILES:
            profile.profile_picture = request.FILES['profile_picture']

        # Password Change Handling
        current_password = request.POST.get("current_password")
        new_password = request.POST.get("new_password")
        confirm_password = request.POST.get("confirm_password")  # Fixed field name

        success_message = None
        error_message = None

        if current_password and new_password and confirm_password:
            if check_password(current_password, request.user.password):  # Correct order of checks
                if new_password == confirm_password:
                    request.user.set_password(new_password)
                    request.user.save()
                    update_session_auth_hash(request, request.user)
                    success_message = "Password changed successfully."
                else:
                    error_message = "Passwords do not match."
            else:
                error_message = "Current password is incorrect."

        profile.save()

        return render(request, "mainpage.html", {
            "profile": profile,
            "success": success_message,
            "error": error_message
        })

    return render(request, "partials/settings.html", {'profile': profile})

@login_required
def mainpage(request):
    profile = UserProfile.objects.get(user=request.user)
    username = request.user.username
    
    if request.method == "POST":
        project_title = request.POST.get('title')
        project_description = request.POST.get('description')

        new_project = RoomDesigns.objects.create(
            user=request.user,
            title=project_title,
            description=project_description
        )

        return redirect('createpage', project_id=new_project.room_id)

    context = {
        'username': username,
        'profile': profile,
    }

    return render(request, "mainpage.html", context)

@login_required
def my_projects(request):
    profile = UserProfile.objects.get(user=request.user)
    username = request.user.username

    user_projects = RoomDesigns.objects.filter(user=request.user)

    context = {
        'username': username,
        'profile': profile,
        'user_projects': user_projects,
    }

    return render(request, "partials/my-projects.html", context)

def edit_projects(request, project_id):
    project = get_object_or_404(RoomDesigns, room_id=project_id)
    
    if request.method == "POST":
        project.title = request.POST.get('title')
        project.description = request.POST.get('description')
        project.save()
        return redirect('my_projects')
    return render(request, "mainpage.html", {'project': project})

@login_required
def delete_project(request, project_id):
    project = get_object_or_404(RoomDesigns, room_id=project_id, user=request.user)
    project.delete()
    success_message = "Project deleted successfully."
    
    profile = UserProfile.objects.get(user=request.user)
    return render(request, "mainpage.html", {
        'profile': profile,
        'success': success_message
        })
    
@login_required
def post_project(request, room_id):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            description = data.get('description', '')  # Get the custom description

            # Get the room design
            room_design = RoomDesigns.objects.get(room_id=room_id)
            
            if PublicPost.objects.filter(room_design=room_design).exists():
                return JsonResponse({'status': 'error', 'message': 'Project already posted'}, status=400)
            
            # Create a PublicPost
            public_post = PublicPost(
                room_design=room_design,
                user=request.user,
                description=description,  # Use the custom description
                is_public=True,
            )
            public_post.save()

            return JsonResponse({'status': 'success', 'message': 'Project posted successfully'})
        except RoomDesigns.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Room design not found'}, status=404)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=405)

def community(request):
    profile = UserProfile.objects.get(user=request.user)
    username = request.user.username
    posts = PublicPost.objects.filter(is_public=True).order_by('-created_at')
    context = {
        'username': username,
        'profile': profile,
        'posts': posts
    }
    return render(request, 'community.html', context)

@login_required
def createpage(request, project_id):
    try:
        project = RoomDesigns.objects.get(room_id=project_id)

        if project.user != request.user:
            return HttpResponseForbidden("You are not authorized to access this project.")

        profile = UserProfile.objects.get(user=request.user)
        username = request.user.username

        if request.method == 'POST' and 'screenshot' in request.FILES:
            if project.screenshot:
                project.screenshot.delete()
            
            project.screenshot = request.FILES['screenshot']
            project.save()
            return JsonResponse({'status': 'success', 'url': project.screenshot.url})

        return render(request, "createpage.html", {
            'username': username,
            'profile': profile,
            'project_id': project.room_id,
            'project_title': project.title,
            'screenshot_url': project.screenshot.url if project.screenshot else None,
        })

    except RoomDesigns.DoesNotExist:
        return HttpResponseNotFound("Project not found.")
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    
@require_POST
def save_screenshot(request, project_id):
    try:
        project = RoomDesigns.objects.get(room_id=project_id)
        
        if project.user != request.user:
            return JsonResponse({'status': 'error', 'message': 'Unauthorized'}, status=403)

        if 'screenshot' not in request.FILES:
            return JsonResponse({'status': 'error', 'message': 'No file provided'}, status=400)

        if project.screenshot:
            project.screenshot.delete()
        
        project.screenshot = request.FILES['screenshot']
        project.save()

        return JsonResponse({
            'status': 'success',
            'url': project.screenshot.url,
            'message': 'Screenshot updated successfully'
        })

    except RoomDesigns.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Project not found'}, status=404)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    
def check_screenshot(request, project_id):
    try:
        project = RoomDesigns.objects.get(room_id=project_id)
        return JsonResponse({
            'status': 'success',
            'has_screenshot': bool(project.screenshot)
        })
    except RoomDesigns.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Project not found'}, status=404)
    
def screenshots(request):
    try:
        rooms = RoomDesigns.objects.filter(user=request.user)
        
        return render(request, 'partials/screenshots.html', {
            'rooms': rooms
            })
    except Exception as e:
        return render(request, 'partials/screenshots.html', {
            'error': str(e),
        })
        
@csrf_exempt
def delete_room(request, room_id):
    if request.method == 'DELETE':
        try:
            room = RoomDesigns.objects.get(id=room_id)
            room.delete()
            return JsonResponse({'status': 'success'}, status=200)
        except RoomDesigns.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Room not found'}, status=404)
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=400)

@csrf_exempt
def save_room_design(request, room_id):
    if request.method == 'POST':
        try:
            # Get the RoomDesigns instance
            room_design = RoomDesigns.objects.get(room_id=room_id)
            
            # Ensure the user is authorized to save the design
            if room_design.user != request.user:
                return JsonResponse({'status': 'error', 'message': 'You are not authorized to save this design.'}, status=403)
            
            # Parse the JSON data from the request
            data = json.loads(request.body)
            
            # Update the fields
            room_design.title = data.get('title', room_design.title)
            room_design.description = data.get('description', room_design.description)
            room_design.length = data.get('length', room_design.length)
            room_design.breadth = data.get('breadth', room_design.breadth)
            room_design.height = data.get('height', room_design.height)
            room_design.floor_color = data.get('floor_color', room_design.floor_color)
            room_design.wall_color = data.get('wall_color', room_design.wall_color)
            room_design.data = data.get('data', room_design.data)  # Save furniture data
            
            # Save the updated instance
            room_design.save()
            
            return JsonResponse({'status': 'success', 'message': 'Room design saved successfully.'})
        except RoomDesigns.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Room design not found.'}, status=404)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    return JsonResponse({'status': 'error', 'message': 'Invalid request method.'}, status=400)

def get_room_design(request, room_id):
    if request.method == 'GET':
        try:
            # Fetch the RoomDesigns instance
            room_design = RoomDesigns.objects.get(room_id=room_id)
            
            # Prepare the data to return
            room_data = {
                'title': room_design.title,
                'length': room_design.length,
                'breadth': room_design.breadth,
                'floor_color': room_design.floor_color,
                'wall_color': room_design.wall_color,
                'furniture': room_design.data.get('furniture', []),
            }
            
            return JsonResponse({'status': 'success', 'data': room_data})
        except RoomDesigns.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Room design not found.'}, status=404)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    return JsonResponse({'status': 'error', 'message': 'Invalid request method.'}, status=400)


@never_cache
def admin_login(request):
    if request.user.is_authenticated and request.user.is_staff:
        return redirect('fadmin')
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None and user.is_staff:
            auth_login(request, user)
            return redirect('fadmin')
        else:
            messages.error(request, "Invalid admin credentials.")
    response = render(request, 'admin_login.html')
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response['Pragma'] = 'no-cache'
    response['Expires'] = '0'
    return response

@login_required
def admin_logout(request):
    logout(request)
    return redirect('admin_login')

def is_admin(user):
    return user.is_authenticated and (user.is_staff or user.is_superuser)

@login_required(login_url='admin_login')
@user_passes_test(is_admin, login_url='admin_login')
def fadmin(request):
    # Fetch the contact messages and filter by message type
    users = User.objects.all()
    contact_messages = ContactMessage.objects.filter(message_type="contact").order_by('-created_at')
    request_model_messages = ContactMessage.objects.filter(message_type="request_model").order_by('-created_at')

    return render(request, 'fadmin.html', {
        'users': users,
        'contact_messages': contact_messages,
        'request_model_messages': request_model_messages,
    })
