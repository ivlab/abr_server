from django.shortcuts import render
from django.http import HttpResponse

# Create your views here.
def compose(request):
    return render(request, 'compose.html')

def raw_state(request):
    return render(request, 'raw_editor.html')

def sci_interface(request):
    return render(request, 'sci_interface.html')

def state_wizard(request):
    return render(request, 'state_wizard.html')