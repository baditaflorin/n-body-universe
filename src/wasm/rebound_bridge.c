#include <emscripten/emscripten.h>
#include <math.h>
#include <stdint.h>
#include <stdlib.h>

#include "rebound.h"

#define PARTICLE_STRIDE 11

static struct reb_simulation* simulation = NULL;
static double* particle_buffer = NULL;
static unsigned int particle_buffer_capacity = 0;

static void ensure_simulation(void) {
    if (simulation == NULL) {
        simulation = reb_simulation_create();
    }
}

static void ensure_particle_buffer(unsigned int count) {
    if (particle_buffer_capacity >= count) {
        return;
    }

    double* next = realloc(particle_buffer, sizeof(double) * count * PARTICLE_STRIDE);
    if (next == NULL) {
        return;
    }

    particle_buffer = next;
    particle_buffer_capacity = count;
}

static double estimate_period(const struct reb_particle* particle) {
    if (simulation == NULL || simulation->N < 2 || particle->hash == simulation->particles[0].hash) {
        return 0.0;
    }

    const struct reb_particle* primary = &simulation->particles[0];
    const double dx = particle->x - primary->x;
    const double dy = particle->y - primary->y;
    const double dz = particle->z - primary->z;
    const double dvx = particle->vx - primary->vx;
    const double dvy = particle->vy - primary->vy;
    const double dvz = particle->vz - primary->vz;
    const double radius = sqrt(dx * dx + dy * dy + dz * dz);
    if (radius <= 0.0) {
        return 0.0;
    }

    const double velocity_squared = dvx * dvx + dvy * dvy + dvz * dvz;
    const double mu = simulation->G * (primary->m + particle->m);
    const double specific_energy = 0.5 * velocity_squared - mu / radius;
    if (specific_energy >= 0.0 || mu <= 0.0) {
        return 0.0;
    }

    const double semi_major_axis = -mu / (2.0 * specific_energy);
    return 2.0 * M_PI * sqrt((semi_major_axis * semi_major_axis * semi_major_axis) / mu);
}

EMSCRIPTEN_KEEPALIVE
void nu_reset(double gravitational_constant, double timestep, int integrator) {
    if (simulation != NULL) {
        reb_simulation_free(simulation);
    }

    simulation = reb_simulation_create();
    simulation->G = gravitational_constant;
    simulation->dt = timestep;
    simulation->integrator = integrator;
    simulation->exact_finish_time = 1;
    simulation->force_is_velocity_dependent = 0;
}

EMSCRIPTEN_KEEPALIVE
int nu_add_particle(
    int id,
    double mass,
    double radius,
    double x,
    double y,
    double z,
    double vx,
    double vy,
    double vz
) {
    ensure_simulation();

    struct reb_particle particle = {0};
    particle.hash = (uint32_t)id;
    particle.m = mass;
    particle.r = radius;
    particle.x = x;
    particle.y = y;
    particle.z = z;
    particle.vx = vx;
    particle.vy = vy;
    particle.vz = vz;
    reb_simulation_add(simulation, particle);
    return simulation->N;
}

EMSCRIPTEN_KEEPALIVE
void nu_move_to_com(void) {
    ensure_simulation();
    reb_simulation_move_to_com(simulation);
}

EMSCRIPTEN_KEEPALIVE
int nu_step(double timestep, int steps) {
    ensure_simulation();
    if (steps < 1) {
        steps = 1;
    }
    if (timestep > 0.0) {
        simulation->dt = timestep;
    }

    for (int i = 0; i < steps; i++) {
        const enum REB_STATUS status = reb_simulation_integrate(simulation, simulation->t + simulation->dt);
        if (status != REB_STATUS_SUCCESS) {
            return (int)status;
        }
    }

    return 0;
}

EMSCRIPTEN_KEEPALIVE
int nu_particle_count(void) {
    ensure_simulation();
    return simulation->N;
}

EMSCRIPTEN_KEEPALIVE
double nu_time(void) {
    ensure_simulation();
    return simulation->t;
}

EMSCRIPTEN_KEEPALIVE
double nu_energy(void) {
    ensure_simulation();
    return reb_simulation_energy(simulation);
}

EMSCRIPTEN_KEEPALIVE
double* nu_get_particle_buffer(void) {
    ensure_simulation();
    ensure_particle_buffer(simulation->N);
    if (particle_buffer == NULL) {
        return NULL;
    }

    for (unsigned int i = 0; i < simulation->N; i++) {
        const struct reb_particle* particle = &simulation->particles[i];
        const unsigned int base = i * PARTICLE_STRIDE;
        const double speed = sqrt(
            particle->vx * particle->vx + particle->vy * particle->vy + particle->vz * particle->vz
        );

        particle_buffer[base] = (double)particle->hash;
        particle_buffer[base + 1] = particle->m;
        particle_buffer[base + 2] = particle->r;
        particle_buffer[base + 3] = particle->x;
        particle_buffer[base + 4] = particle->y;
        particle_buffer[base + 5] = particle->z;
        particle_buffer[base + 6] = particle->vx;
        particle_buffer[base + 7] = particle->vy;
        particle_buffer[base + 8] = particle->vz;
        particle_buffer[base + 9] = estimate_period(particle);
        particle_buffer[base + 10] = speed;
    }

    return particle_buffer;
}

EMSCRIPTEN_KEEPALIVE
const char* nu_rebound_version(void) {
    return reb_version_str;
}

