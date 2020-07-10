from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.conf import settings

# Create your views here.
def index(request):
    return render(request, 'abr_server.html')

def schema(request):
    return redirect(settings.STATIC_URL + 'schemas/model2.json')