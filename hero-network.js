(() => {
  'use strict';
  const debounce = (fn, delay) => { let timer; return () => { clearTimeout(timer); timer = setTimeout(fn, delay); }; };
  const initNetworkCanvas = () => {
    const canvas = document.getElementById('network-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const particles = [];
    let particleCount = 80;
    let connectionDistance = 150;
    const mouseRadius = 200;
    let animationId;
    let mouse = { x: null, y: null };

    // Obtener configuración según tamaño de pantalla
    const getParticleConfig = () => {
      const width = window.innerWidth;
      if (width <= 480) {
        return { count: 35, distance: 110 };
      } else if (width <= 640) {
        return { count: 45, distance: 125 };
      } else if (width <= 768) {
        return { count: 60, distance: 135 };
      } else {
        return { count: 80, distance: 150 };
      }
    };

    // Configurar tamaño del canvas
    const resizeCanvas = () => {
      const hero = canvas.parentElement;
      canvas.width = hero.offsetWidth;
      canvas.height = hero.offsetHeight;
      
      // Actualizar configuración según tamaño
      const config = getParticleConfig();
      particleCount = config.count;
      connectionDistance = config.distance;
    };

    // Clase Particle
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = (Math.random() - 0.5) * 0.8;
        this.radius = Math.random() * 2 + 1;
        this.baseRadius = this.radius;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(76, 124, 175, 0.9)';
        ctx.fill();
      }

      update() {
        // Movimiento
        this.x += this.vx;
        this.y += this.vy;

        // Rebote en bordes
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

        // Interacción con el mouse
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < mouseRadius) {
            const force = (mouseRadius - distance) / mouseRadius;
            this.x -= dx * force * 0.02;
            this.y -= dy * force * 0.02;
            this.radius = this.baseRadius + force * 2;
          } else {
            this.radius = this.baseRadius;
          }
        }

        this.draw();
      }
    }

    // Crear partículas
    const createParticles = () => {
      particles.length = 0;
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    // Dibujar conexiones
    const drawConnections = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            const opacity = (1 - distance / connectionDistance) * 0.6;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(76, 124, 175, ${opacity})`;
            ctx.lineWidth = 1.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    };

    // Loop de animación
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => particle.update());
      drawConnections();
      
      animationId = requestAnimationFrame(animate);
    };

    // Event listeners
    window.addEventListener('resize', debounce(() => {
      resizeCanvas();
      createParticles();
    }, 200));

    canvas.parentElement.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    canvas.parentElement.addEventListener('mouseleave', () => {
      mouse.x = null;
      mouse.y = null;
    });

    // Iniciar
    resizeCanvas();
    createParticles();
    animate();
  };

  initNetworkCanvas();
})();
